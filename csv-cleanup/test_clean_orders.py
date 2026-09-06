import csv
import io
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from clean_orders import analyze, write_results

HEADER = 'order_id,date,customer,quantity,unit_price,status\n'
GOOD = 'ONE,2026-08-01,Example,3,0.10,paid\n'


class CleanupTests(unittest.TestCase):
    def test_complete_sample_reconciles_and_preserves_rejections(self):
        result = analyze(Path(__file__).with_name('sample-orders.csv').read_text(encoding='utf-8'))
        s = result['summary']
        self.assertEqual((s['input_records'], s['accepted_records'], s['rejected_records']), (12, 6, 6))
        self.assertEqual(s['collected_revenue_usd'], '89.75')
        self.assertEqual(s['order_value_by_status_usd'], {'paid': '89.75', 'pending': '19.95', 'refunded': '9.00'})
        self.assertEqual(result['cleaned_rows'][1]['customer'], 'Cedar, Market')
        self.assertEqual(result['exceptions'][0]['source_line'], 8)

    def test_decimal_math_and_normalization(self):
        result = analyze('\ufeff ORDER_ID ,DATE,CUSTOMER,QUANTITY,UNIT_PRICE,STATUS\n ONE ,2026-08-01, Example ,3,0.10, PAID \n')
        self.assertEqual(result['summary']['collected_revenue_usd'], '0.30')
        self.assertEqual(result['cleaned_rows'][0]['order_id'], 'ONE')
        self.assertEqual(result['summary']['accepted_records_with_whitespace_or_case_cleanup'], 1)

    def test_invalid_headers_are_fatal(self):
        for data in ['', 'order_id,date\n', HEADER.replace('status', 'date'), HEADER.replace('status', 'other')]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                analyze(data)

    def test_invalid_fields_never_enter_totals(self):
        for row in [GOOD.replace('0.10', 'Infinity'), GOOD.replace('0.10', '-1'), GOOD.replace('0.10', '1.001'),
                    GOOD.replace(',3,', ',1.5,'), GOOD.replace('2026-08-01', '2026-02-30'),
                    GOOD.replace('Example', '=SUM(1)'), GOOD.replace('Example', '"line\nbreak"'),
                    GOOD.replace('paid', 'unknown'), 'ONE,2026-08-01,Example,3\n']:
            with self.subTest(row=row):
                result=analyze(HEADER+row)
                self.assertEqual(result['summary']['accepted_records'], 0)
                self.assertEqual(result['summary']['collected_revenue_usd'], '0.00')
                self.assertEqual(len(result['exceptions']), 1)

    def test_duplicates_are_flagged_even_after_invalid_first_occurrence(self):
        result=analyze(HEADER+GOOD.replace('0.10', 'bad')+GOOD)
        self.assertEqual(result['summary']['rejected_records'], 2)
        self.assertIn('Duplicate order ID', result['exceptions'][1]['reason'])

    def test_blank_and_multiline_records_keep_source_line_numbers(self):
        result=analyze(HEADER+'\n'+GOOD.replace('Example', '"two\nlines"')+GOOD.replace('ONE', 'TWO'))
        self.assertEqual([r['source_line'] for r in result['exceptions']], [2, 3])
        self.assertEqual(result['cleaned_rows'][0]['source_line'], 5)

    def test_csv_quotes_roundtrip_and_outputs_refuse_overwrite(self):
        result=analyze(HEADER+GOOD.replace('Example', '"A ""quoted"", customer"'))
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'result'
            write_results(result,out)
            rows=list(csv.DictReader(io.StringIO((out/'cleaned-orders.csv').read_text())))
            self.assertEqual(rows[0]['customer'], 'A "quoted", customer')
            self.assertEqual(json.loads((out/'summary.json').read_text())['collected_revenue_usd'],'0.30')
            with self.assertRaises(FileExistsError): write_results(result,out)

    def test_size_and_record_limits_include_blank_rows(self):
        with patch('clean_orders.MAX_ROWS', 2), self.assertRaises(ValueError):
            analyze(HEADER+'\n\n\n')
        with patch('clean_orders.MAX_BYTES', 10), self.assertRaises(ValueError):
            analyze(HEADER+GOOD)


if __name__ == '__main__': unittest.main()
