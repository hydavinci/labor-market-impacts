/* Read-only status view: never fetches upstream research or changes chart values. */
(() => {
  'use strict';
  let status = null;
  const box = document.getElementById('updateStatus');
  const words = {
    zh: {title:'数据版本与更新',intro:'项目每周自动检查研究来源；兼容性和数据校验通过后自动更新，无需审核或通知。无法验证时保留旧版。检查时间不代表研究发布日期。',version:'当前研究版本',checked:'最近检查（北京时间）',successful:'最近完整检查',schedule:'检查频率',weekly:'每周一 09:00 · 北京时间',baseline:'已建立监测基线；不代表已确认所有最新研究。',unchanged:'本次检查未发现所监测来源发生变化。',pending_review:'来源变化尚未通过自动校验，保留现有图表。',updated:'新数据已通过自动校验并发布，旧版已备份。',validation_failed:'来源变化未通过自动校验，本次跳过更新并保留旧版；下次检查会重试，无需人工审核。',check_failed:'最近检查未全部成功，不能确认是否有新数据；现有图表保留。',unavailable:'暂时无法读取检查状态；不影响当前研究图表。',mode:'更新方式',automatic:'自动校验并发布',lastPublished:'最近自动发布',history:'检查与发布记录',empty:'暂无检查记录。',initial:'建立来源监测基线（非数据更新）',changed:'检测到来源变化',skipped:'自动校验未通过，保留旧版',failed:'来源检查未全部成功',published:'数据版本发布',stale:'检查记录已超过 9 天，请核查定时任务。',unknown:'尚无记录'},
    en: {title:'Data version & updates',intro:'The project checks sources weekly and automatically publishes compatible, validated data. No approval or notifications. Unverifiable changes leave the previous version intact. Check dates are not research publication dates.',version:'Current research version',checked:'Last check (Shanghai)',successful:'Last complete check',schedule:'Check schedule',weekly:'Mondays 09:00 · Asia/Shanghai',baseline:'Monitoring baseline established; this does not certify that all latest research is included.',unchanged:'No changes found in the monitored sources during this check.',pending_review:'Source changes have not passed automatic validation. Existing data is retained.',updated:'Validated data was published automatically. The previous version is backed up.',validation_failed:'Source changes could not be validated. Update skipped; previous data retained. A future check will retry without manual approval.',check_failed:'The latest check was incomplete; new data cannot be ruled out. Existing chart data is retained.',unavailable:'Check status is temporarily unavailable. The existing research chart is unaffected.',mode:'Update mode',automatic:'Validate & publish automatically',lastPublished:'Last automatic publication',history:'Check & publication history',empty:'No checks recorded yet.',initial:'Monitoring baseline established (not a data update)',changed:'Source change detected',skipped:'Validation failed; previous version retained',failed:'Source check incomplete',published:'Data version published',stale:'Last check is over 9 days old. Please verify the scheduled task.',unknown:'Not recorded'}
  };
  function render() {
    const lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
    const t = words[lang];
    const node = (tag, text, cls) => { const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e; };
    const date = value => { const d = new Date(value); return value && !isNaN(d) ? new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d) : t.unknown; };
    box.replaceChildren(node('h2',t.title),node('p',t.intro,'update-intro'));
    if (!status) {box.append(node('p',t.unavailable));return;}
    const dl=node('dl','','update-facts');
    for (const [key,value] of [
      [t.version,`${status.dataVersion?.publishedAt || '—'} · ${String(status.dataVersion?.sha256 || '').slice(0,8)}`],
      [t.checked,date(status.lastCheckedAt)],
      [t.successful,date(status.lastSuccessfulCheckAt)],
      [t.schedule,t.weekly],
      [t.mode,t.automatic],
      [t.lastPublished,date(status.lastPublishedAt || [...(status.history || [])].reverse().find(e=>e.type==='published')?.at)]
    ]) {const row=node('div','');row.append(node('dt',key),node('dd',value));dl.append(row);}
    box.append(dl,node('p',t[status.status] || t.unavailable,'update-result'));
    if(status.automaticUpdate?.reason) box.append(node('p',String(status.automaticUpdate.reason).slice(0,500),'update-warning'));
    if (Date.now()-Date.parse(status.lastCheckedAt)>9*86400000) box.append(node('p',t.stale,'update-warning'));
    const details=node('details','');details.append(node('summary',t.history));
    const list=node('ul','');
    const labels={baseline:t.initial,source_change:t.changed,check_failed:t.failed,published:t.published,updated:t.published,validation_failed:t.skipped};
    for(const entry of (Array.isArray(status.history)?status.history:[]).slice().reverse().slice(0,10)) list.append(node('li',`${date(entry.at)} — ${labels[entry.type] || t.changed}${entry.count ? ` (${entry.count})` : ''}`));
    if(!list.childElementCount) list.append(node('li',t.empty));
    details.append(list);box.append(details);
  }
  render();
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  fetch('update-status.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(data=>{
    if(data.schemaVersion!==1 || !data.lastCheckedAt)throw Error('Invalid status');
    status=data;render();
  }).catch(()=>{status=null;render();});
})();
