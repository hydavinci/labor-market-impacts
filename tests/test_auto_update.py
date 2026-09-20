"""Offline tests: real PNG adapter + fake HTTP, never change production data."""
import copy
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import project_update as a
import check_sources as m
from figure_adapter import extract, CENTER, RADIUS

class AutoUpdateTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.png=(ROOT/'research/figure-2.png').read_bytes()
        cls.article=(ROOT/'tests/fixtures/article.html').read_bytes()
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);(self.root/'research').mkdir()
        for f in ['data.json','research/figure-2.png','research/extraction-contract.json']:
            shutil.copy2(ROOT/f,self.root/f)
        self.original=(self.root/'data.json').read_bytes()
        self.html=self.article;self.figure=self.png
    def fetch(self,url,size,binary):
        if url==a.ARTICLE:return m.FetchResult(url,self.html,'text/html')
        if url.endswith('.png'):return m.FetchResult(url,self.figure,'image/png')
        return m.FetchResult(url,b'<main>research</main>','text/html')
    def run_update(self):return a.run(self.root,self.fetch,lambda:'2026-09-20T17:00:00Z')
    def test_baseline_no_churn(self):
        self.assertEqual(self.run_update()['status'],'unchanged')
        self.assertEqual(self.run_update()['status'],'unchanged')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
        public=json.loads((self.root/'update-status.json').read_text())
        self.assertEqual(public['mode'],'automatic');self.assertEqual(public['pendingCount'],0)
    def test_prose_publish_archive_repeat(self):
        self.html=self.html.replace(b'just 33%',b'just 34%')
        self.assertEqual(self.run_update()['status'],'updated')
        updated=(self.root/'data.json').read_bytes();data=json.loads(updated)
        self.assertEqual(data['categories'][2]['observed'],34)
        self.assertEqual(list((self.root/'.monitor/versions').glob('*.json'))[0].read_bytes(),self.original)
        self.assertEqual((self.root/'data.json').stat().st_mode&0o777,0o644)
        self.assertEqual(self.run_update()['status'],'unchanged')
        self.assertEqual((self.root/'data.json').read_bytes(),updated)
    def test_actual_png_changed_marker_publishes(self):
        im=Image.open(io.BytesIO(self.png)).convert('RGB');d=ImageDraw.Draw(im)
        x,y=CENTER;target=y-RADIUS*.96
        d.line((x,y-RADIUS*.91,x,target),fill=(44,132,219),width=6)
        d.ellipse((x-16,target-16,x+16,target+16),fill=(44,132,219))
        out=io.BytesIO();im.save(out,format='PNG');self.figure=out.getvalue()
        self.assertEqual(extract(self.figure,self.png)[0]['theoretical'],96)
        self.assertEqual(self.run_update()['status'],'updated')
        self.assertEqual(json.loads((self.root/'data.json').read_text())['categories'][0]['theoretical'],96)
    def test_incompatible_method_keeps_data(self):
        self.html=self.html.replace(b'half weight',b'full weight')
        self.assertEqual(self.run_update()['status'],'validation_failed')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
    def test_out_of_range_prose_keeps_data(self):
        self.html=self.html.replace(b'just 33%',b'just 101%')
        self.assertEqual(self.run_update()['status'],'validation_failed')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
    def test_label_change_rejected(self):
        im=Image.open(io.BytesIO(self.png)).convert('RGB');ImageDraw.Draw(im).rectangle((2000,500,2200,600),fill='black')
        out=io.BytesIO();im.save(out,format='PNG');self.figure=out.getvalue()
        self.assertEqual(self.run_update()['status'],'validation_failed')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
    def test_bad_geometry(self):
        im=Image.new('RGB',(100,100));out=io.BytesIO();im.save(out,format='PNG');self.figure=out.getvalue()
        self.assertEqual(self.run_update()['status'],'validation_failed')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
    def test_unapproved_url(self):
        self.html=self.html.replace(b'www-cdn.anthropic.com',b'evil.example')
        self.assertEqual(self.run_update()['status'],'validation_failed')
    def test_network_failure(self):
        def bad(*args):raise OSError('offline')
        self.assertEqual(a.run(self.root,bad)['status'],'check_failed')
        self.assertEqual((self.root/'data.json').read_bytes(),self.original)
    def test_crash_after_publish_recovers_without_churn(self):
        self.html=self.html.replace(b'just 33%',b'just 34%');self.run_update()
        (self.root/'.monitor/auto-update-state.json').unlink()
        updated=(self.root/'data.json').read_bytes()
        self.assertEqual(self.run_update()['status'],'unchanged')
        self.assertEqual((self.root/'data.json').read_bytes(),updated)
        self.assertTrue(json.loads((self.root/'update-status.json').read_text())['lastPublishedAt'])
    def test_locked(self):
        import fcntl
        private=self.root/'.monitor';private.mkdir()
        with (private/'auto-update.lock').open('a') as f:
            fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)
            with self.assertRaises(BlockingIOError):self.run_update()

if __name__=='__main__':unittest.main()
