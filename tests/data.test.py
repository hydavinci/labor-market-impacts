"""Offline checks for data contract and disclosed provenance. Run: python3 tests/data.test.py"""
import json
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class DataTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data.json').read_text())
        cls.rows = cls.data['categories']
    def test_categories(self):
        self.assertEqual(len(self.rows), 22)
        self.assertEqual(len({x['id'] for x in self.rows}), 22)
    def test_bounds(self):
        for row in self.rows:
            self.assertTrue(0 <= row['observed'] <= row['theoretical'] <= 100, row['id'])
    def test_languages(self):
        for row in self.rows:
            for lang in ('zh', 'en'):
                self.assertTrue(row[lang])
                self.assertTrue(row['description'][lang])
        for key in ('dataNote', 'method'):
            for lang in ('zh', 'en'):
                self.assertTrue(self.data['meta'][key][lang])
    def test_explicit_values(self):
        rows = {r['id']:r for r in self.rows}
        self.assertEqual(rows['computer-math']['theoretical'],94)
        self.assertEqual(rows['computer-math']['observed'],33)
        self.assertEqual(rows['office-admin']['theoretical'],90)
    def test_provenance(self):
        self.assertEqual(self.data['meta']['publishedAt'],'2026-03-05')
        self.assertIn('anthropic.com/research/labor-market-impacts',self.data['meta']['sourceUrl'])
        self.assertIn('approximate',self.data['meta']['dataNote']['en'])
        self.assertIn('not all AI use',self.data['meta']['method']['en'])
        self.assertEqual(sum(r['precision']=='reported' for r in self.rows),1)

if __name__=='__main__': unittest.main()
