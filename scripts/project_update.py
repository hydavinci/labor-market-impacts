#!/usr/bin/env python3
"""Project-owned, locked check/validate/backup/atomic-publish pipeline. No AI API."""
import argparse
import contextlib
import copy
import fcntl
import html
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import check_sources as monitor
from figure_adapter import extract, IDS

ARTICLE='https://www.anthropic.com/research/labor-market-impacts'


def source_contract(raw, contract):
    text=raw.decode('utf-8')
    normalized=monitor.normalize_html(raw,ARTICLE)[0]
    paragraphs=[monitor.normalize_html(p.encode(),ARTICLE)[0] for p in re.findall(r'<p\b[^>]*>(.*?)</p>',text,re.S|re.I)]
    for expected in contract['methodParagraphs']:
        if sum(re.sub(r'\d+(?:\.\d+)?%', '<percent>',p)==expected for p in paragraphs)!=1:
            raise ValueError('Unsupported research methodology or wording; adapter cannot confirm compatibility')
    patterns=[r'computer & math \((\d+(?:\.\d+)?)%\)',r'office & admin \((\d+(?:\.\d+)?)%\)',r'claude currently covers just (\d+(?:\.\d+)?)% of all tasks in the computer & math category']
    reported=[]
    for pattern in patterns:
        found=re.findall(pattern,normalized)
        if len(found)!=1 or not 0<=float(found[0])<=100:
            raise ValueError('Missing, ambiguous or invalid authoritative prose values')
        reported.append(float(found[0]))
    figures=[f for f in re.findall(r'<figure\b[^>]*>.*?</figure>',text,re.S|re.I) if 'figure 2: theoretical capability and observed exposure by occupational category' in monitor.normalize_html(f.encode(),ARTICLE)[0]]
    if len(figures)!=1:
        raise ValueError('Figure 2 cannot be identified unambiguously')
    match=re.search(r'<img\b[^>]*\bsrc="([^"]+)"',figures[0],re.I)
    if not match:raise ValueError('Figure image missing')
    url=html.unescape(match[1]);parsed=urlparse(url)
    if parsed.path=='/_next/image':url=parse_qs(parsed.query).get('url',[''])[0]
    parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.hostname not in ('cdn.sanity.io','www-cdn.anthropic.com') or not re.fullmatch(r'/images/4zrzovbb/website/[a-f0-9]+-4096x4096\.png',parsed.path):
        raise ValueError('Unsupported Figure 2 asset URL')
    return 'https://cdn.sanity.io'+parsed.path, reported


def validate(data):
    rows=data['categories']
    if [r['id'] for r in rows]!=IDS:raise ValueError('Category identity/order mismatch')
    for row in rows:
        if not 0<=row['observed']<=row['theoretical']<=100:raise ValueError('Invalid coverage bounds')
        for lang in ('zh','en'):
            if not row[lang] or not row['description'][lang]:raise ValueError('Missing bilingual data')
    for k in ('dataNote','method'):
        if not all(data['meta'][k].get(l) for l in ('zh','en')):raise ValueError('Missing provenance')


def publish(path, raw):
    fd,tmp=tempfile.mkstemp(prefix='.publish-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
        os.chmod(tmp,0o644);os.replace(tmp,path)
        directory=os.open(path.parent,os.O_DIRECTORY)
        try:os.fsync(directory)
        finally:os.close(directory)
    finally:
        with contextlib.suppress(FileNotFoundError):os.unlink(tmp)


def run(root, fetcher=monitor.default_fetch, now_func=monitor.utc_now_iso):
    root=Path(root).resolve();private=root/'.monitor';private.mkdir(exist_ok=True,mode=0o700);os.chmod(private,0o700)
    with (private/'auto-update.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        at=now_func();auto_path=private/'auto-update-state.json';state=monitor.load_json(auto_path,{})
        data_path=root/'data.json';old=data_path.read_bytes();current=json.loads(old);validate(current)
        journal=monitor.load_json(private/'publication-journal.json',{})
        if journal.get('after')==monitor.sha256_bytes(old) and state.get('accepted')!=journal.get('evidence'):
            state['accepted']=journal['evidence'];state['lastPublishedAt']=journal['at']
            state['history']=monitor.append_history(state.get('history',[]),{'at':journal['at'],'type':'published','sha256':journal['after']})
        cache={}
        def fetch(url,size,binary):
            if url not in cache:cache[url]=fetcher(url,size,binary)
            return cache[url]
        try:
            report=monitor.run_check(root,fetch,now_func)
        except Exception as exc:
            report={'errors':[str(exc)]}
        public=monitor.load_json(root/'update-status.json',{});public.update(schemaVersion=1,lastCheckedAt=at,mode='automatic',pendingCount=0)
        status='unchanged';reason=None
        history=state.get('history',public.get('history',[]))
        try:
            if report['errors']:raise OSError('; '.join(report['errors']))
            if current['meta']['sourceUrl']!=ARTICLE:raise ValueError('Unsupported research source')
            contract=monitor.load_json(root/'research/extraction-contract.json',{})
            raw=fetch(ARTICLE,monitor.MAX_TEXT_BYTES,False).content
            url,reported=source_contract(raw,contract)
            figure=fetch(url,monitor.MAX_BINARY_BYTES,True).content
            figure_hash=monitor.sha256_bytes(figure)
            reference=(root/'research/figure-2.png').read_bytes()
            if monitor.sha256_bytes(reference)!=contract['figureSha256']:raise ValueError('Adapter reference hash mismatch')
            # Validate even the bootstrap image; unchanged baseline never rewrites approximate values.
            values=extract(figure,reference)
            evidence={'figureSha256':figure_hash,'figureUrl':url,'reported':reported}
            previous=state.get('accepted')
            if previous is None:
                rows={r['id']:r for r in current['categories']}
                previous={'figureSha256':contract['figureSha256'],'figureUrl':current['meta']['figureUrl'],'reported':[rows['computer-math']['theoretical'],rows['office-admin']['theoretical'],rows['computer-math']['observed']]}
            if evidence!=previous:
                candidate=copy.deepcopy(current)
                if figure_hash!=previous['figureSha256']:
                    for row,value in zip(candidate['categories'],values):
                        row.update(theoretical=value['theoretical'],observed=value['observed'])
                rows={r['id']:r for r in candidate['categories']}
                rows['computer-math'].update(theoretical=reported[0],observed=reported[2])
                rows['office-admin']['theoretical']=reported[1]
                for row in candidate['categories']:
                    row['reportedMetrics']=['theoretical','observed'] if row['id']=='computer-math' else ['theoretical'] if row['id']=='office-admin' else []
                    row['precision']='reported' if row['id']=='computer-math' else 'approximate'
                rows['computer-math']['description']={'zh':'编程与分析是 Claude 的常见用途。此类指标采用来源正文明确报告的数值，优先于读图近似值。','en':'Coding and analysis are common Claude uses. Explicit prose values take precedence over approximate figure readings.'}
                rows['office-admin']['description']={'zh':'文书、数据录入与信息流转具有较高覆盖。理论值来自正文，观察值为读图近似值。','en':'Documents, data entry and information routing have high coverage. Theory comes from prose; observed coverage is approximate.'}
                candidate['meta'].update(figureUrl=url,updatedAt=at,sourceEvidence=copy.deepcopy(evidence))
                candidate['meta']['dataNote']={'zh':'研究快照，非实时预测。计算机与数学两项及办公室与行政理论值采用来源正文；其余为 Figure 2 自动读图近似值（≈，约有 2 个百分点读图误差），不是官方精确数据集。正文优先于图示。分类基于美国职业，不代表中国或全球就业数据。','en':'Research snapshot, not a live forecast. Computer & math metrics and Office & admin theory use explicit source prose; others are approximate Figure 2 readings (≈, about 2pp digitization uncertainty), not an official exact dataset. Prose takes precedence over the plot. US occupations, not Chinese or global employment data.'}
                validate(candidate)
                new=(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n').encode()
                versions=private/'versions';versions.mkdir(exist_ok=True,mode=0o700)
                backup=versions/(monitor.sha256_bytes(old)+'.json')
                if not backup.exists():
                    with backup.open('xb') as f:f.write(old);f.flush();os.fsync(f.fileno())
                    os.chmod(backup,0o600)
                sources=private/'accepted-sources';sources.mkdir(exist_ok=True,mode=0o700)
                for name,body in [(figure_hash+'.png',figure),(monitor.sha256_bytes(raw)+'.html',raw)]:
                    artifact=sources/name
                    if not artifact.exists():
                        with artifact.open('xb') as f:f.write(body);f.flush();os.fsync(f.fileno())
                        os.chmod(artifact,0o600)
                candidate['meta']['sourceEvidence']['articleSha256']=monitor.sha256_bytes(raw)
                new=(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n').encode()
                # Write-ahead record makes a crash after data replacement recoverable on retry.
                monitor.atomic_write_json(private/'publication-journal.json',{'at':at,'before':monitor.sha256_bytes(old),'after':monitor.sha256_bytes(new),'evidence':evidence})
                publish(data_path,new)
                state['lastPublishedAt']=at
                history=monitor.append_history(history,{'at':at,'type':'published','sha256':monitor.sha256_bytes(new)})
                status='updated'
            state['accepted']=evidence
            # Source diffs are machine-handled, not an approval queue.
            ms=monitor.load_json(private/'source-monitor-state.json',{})
            ms['pendingCandidates']=[]
            snapshots=sorted((private/'snapshots').glob('*.json'))
            if snapshots:ms['baseline']=monitor.load_json(snapshots[-1],{}).get('sources',ms.get('baseline'))
            monitor.atomic_write_json(private/'source-monitor-state.json',ms)
        except OSError as exc:
            status='check_failed';reason=str(exc)
        except (ValueError,KeyError,TypeError) as exc:
            status='validation_failed';reason=str(exc)
        if reason:history=monitor.append_history(history,{'at':at,'type':status})
        state['history']=history;state['lastCheckedAt']=at;state['status']=status
        if reason:state['reason']=reason
        else:state.pop('reason',None)
        monitor.atomic_write_json(auto_path,state)
        public.update(status=status,history=history,dataVersion=monitor.data_version(data_path),lastPublishedAt=state.get('lastPublishedAt'),automaticUpdate={'scope':'compatible revisions of the original Anthropic Figure 2','reason':reason})
        monitor.atomic_write_json(root/'update-status.json',public)
        return {'status':status,'errors':[reason] if reason else [],'lastCheckedAt':at}


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args()
    try:result=run(args.root)
    except BlockingIOError:result={'status':'busy','errors':['Another updater holds the lock']}
    print(json.dumps(result,ensure_ascii=False))
    return 0 if result['status'] in ('updated','unchanged','busy') else 2

if __name__=='__main__':raise SystemExit(main())
