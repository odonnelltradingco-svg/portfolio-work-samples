import copy
import csv
import io
import tempfile
import unittest
from pathlib import Path
from clean_tracker import FIELDS, analyze, csv_literal, write_outputs

BASE=Path(__file__).parent

def pack(rows):
    stream=io.StringIO()
    writer=csv.DictWriter(stream, fieldnames=FIELDS)
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue()

class TrackerTests(unittest.TestCase):
    def setUp(self):
        self.row=next(csv.DictReader(io.StringIO((BASE/'sample-tracker.csv').read_text(encoding='utf-8'))))

    def test_sample_conservation_and_unchanged_source(self):
        source=BASE/'sample-tracker.csv'
        original=source.read_bytes()
        with tempfile.TemporaryDirectory() as folder:
            result=write_outputs(source,Path(folder))
            self.assertEqual(result['counts'],{'Active':10,'Archive':4,'Review':4})
            self.assertEqual(sorted(row['source_record'] for row in result['rows']),list(range(1,19)))
            for bucket,count in result['counts'].items():
                with (Path(folder)/(bucket.lower()+'.csv')).open(newline='',encoding='utf-8') as stream:
                    self.assertEqual(len(list(csv.DictReader(stream))),count)
        self.assertEqual(source.read_bytes(),original)

    def test_duplicate_and_conflicting_identity(self):
        same=copy.deepcopy(self.row)
        same['status']=' open '
        same['posting_url']='HTTPS://EXAMPLE.COM/jobs/j001'
        self.assertEqual(analyze(pack([self.row,same]))['counts'],{'Active':1,'Archive':1,'Review':0})
        same['client']='Another client'
        result=analyze(pack([self.row,same]))
        self.assertEqual(result['counts']['Review'],2)
        # A second ID sharing the URL is a conflict, not a discardable duplicate.
        same=copy.deepcopy(self.row)
        same['job_id']='Different ID'
        self.assertEqual(analyze(pack([self.row,same]))['counts']['Review'],2)

    def test_invalid_fields_are_reviewed_without_guessing(self):
        for field,value in [('status','pending?'),('posted_date','09/03/2026'),('posted_date','2026-02-30'),('posting_url','file:///work/tracker')]:
            with self.subTest(field=field,value=value):
                row=dict(self.row,**{field:value})
                self.assertEqual(analyze(pack([row]))['counts']['Review'],1)
        row=dict(self.row,job_id='',posting_url='')
        self.assertEqual(analyze(pack([row]))['counts']['Review'],1)

    def test_age_is_not_a_closure_rule(self):
        row=dict(self.row,posted_date='2020-01-01')
        self.assertEqual(analyze(pack([row]))['counts']['Active'],1)
        row['status']='closed'
        self.assertEqual(analyze(pack([row]))['counts']['Archive'],1)

    def test_different_url_paths_and_queries_are_preserved(self):
        a=dict(self.row,job_id='',posting_url='https://example.com/jobs/A?listing=1')
        b=dict(self.row,job_id='',posting_url='https://example.com/jobs/a?listing=2')
        result=analyze(pack([a,b]))
        self.assertEqual(result['counts']['Active'],2)
        self.assertEqual(result['rows'][0]['clean']['posting_url'],a['posting_url'])

    def test_formula_like_csv_text_and_bad_columns(self):
        for value in ['=1+1',' +SUM(A1:A2)','@thing','-42','\tcontent']:
            self.assertEqual(csv_literal(value),"'"+value)
        self.assertEqual(csv_literal('https://example.com/a'),'https://example.com/a')
        with self.assertRaises(ValueError):
            analyze('Job,Status\nExample,Saved\n')

if __name__=='__main__':
    unittest.main(verbosity=2)
