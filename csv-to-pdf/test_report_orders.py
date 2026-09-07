"""Behavior checks for the published CSV-to-PDF demonstration."""
from decimal import Decimal
from io import BytesIO
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from pypdf import PdfReader
from report_orders import InputError, clean_rows, convert, order_total, render_report

ROOT = Path(__file__).resolve().parent
HEADER = 'order_id,item,quantity,unit_price\n'


class ReportTests(unittest.TestCase):
    def test_original_sample_and_exact_total(self):
        orders = clean_rows((ROOT / 'sample-orders.csv').read_text(encoding='utf-8'))
        self.assertEqual([o.order_id for o in orders], ['DEMO-001', 'DEMO-002', 'DEMO-003'])
        self.assertEqual([o.line_total for o in orders], [Decimal('9.00'), Decimal('12.95'), Decimal('10.50')])
        self.assertEqual(order_total(orders), Decimal('32.45'))

    def test_bom_reordered_columns_whitespace_and_quoted_comma(self):
        orders = clean_rows('\ufeff item ,unit_price,order_id,quantity\n" Book, large ",0.25, ID-1 , 2 \n')
        self.assertEqual((orders[0].item, orders[0].order_id, order_total(orders)), ('Book, large', 'ID-1', Decimal('.50')))

    def test_line_rounding_is_explicit_and_summed(self):
        orders = clean_rows(HEADER + 'A,One,1,0.005\nB,Two,1,0.005\nC,Three,3,0.335\n')
        self.assertEqual([o.line_total for o in orders], [Decimal('.01'), Decimal('.01'), Decimal('1.01')])
        self.assertEqual(order_total(orders), Decimal('1.03'))
        text = '\n'.join(p.extract_text() for p in PdfReader(BytesIO(render_report(orders))).pages)
        self.assertIn('0.335', text)
        self.assertIn('GBP 1.03', text)

    def test_header_and_empty_inputs_rejected(self):
        for text in ['', HEADER, 'order_id,item,quantity,quantity\n', HEADER.replace('item', 'other'), HEADER.rstrip() + ',extra\n']:
            with self.subTest(text=text), self.assertRaises(InputError):
                clean_rows(text)

    def test_duplicate_ids_rejected_after_cleanup(self):
        with self.assertRaisesRegex(InputError, 'duplicate order ID'):
            clean_rows(HEADER + ' A ,One,1,2\nA,Two,2,3\n')

    def test_ragged_blank_and_malformed_records_rejected(self):
        for row in ['A,One,1\n', 'A,One,1,2,extra\n', '\n', 'A,"unterminated,1,2\n']:
            with self.subTest(row=row), self.assertRaises(InputError):
                clean_rows(HEADER + row)

    def test_number_and_text_limits_rejected_without_echoing_values(self):
        for quantity in ['0', '-1', '1.5', '1000001', 'NaN', '1e2']:
            with self.subTest(quantity=quantity), self.assertRaises(InputError):
                clean_rows(HEADER + f'A,One,{quantity},2\n')
        for price in ['NaN', 'Infinity', '-1', '1e2', '1000000001', '1.1234567', '']:
            with self.subTest(price=price), self.assertRaises(InputError):
                clean_rows(HEADER + f'A,One,1,{price}\n')
        for item in ['', 'x' * 161, '\u4e66\u672c', 'Cafe\u0301', 'private\tvalue', 'bad\x7fvalue', 'hidden\u202evalue', '\U0001f600']:
            with self.subTest(item=item), self.assertRaises(InputError):
                clean_rows(HEADER + f'A,{item},1,2\n')
        for order_id in ['\u4e66-1', 'ID\x00ONE', 'ID\u200b1']:
            with self.subTest(order_id=order_id), self.assertRaises(InputError):
                clean_rows(HEADER + f'{order_id},One,1,2\n')

    def test_pdf_has_one_page_exact_amounts_and_escaped_text(self):
        rows = clean_rows(HEADER + 'A,<b>Desk & pen</b>,2,4.50\n')
        pdf = PdfReader(BytesIO(render_report(rows)))
        self.assertEqual(len(pdf.pages), 1)
        text = pdf.pages[0].extract_text()
        for expected in ['<b>Desk & pen</b>', 'GBP 9.00', 'Page 1', 'ALL ORDERS ARE FICTIONAL']:
            self.assertIn(expected, text)
        localized = clean_rows((ROOT / 'sample-accented-orders.csv').read_text(encoding='utf-8'))
        localized_pdf = PdfReader(BytesIO(render_report(localized)))
        self.assertEqual(len(localized_pdf.pages), 1)
        localized_text = localized_pdf.pages[0].extract_text()
        for order in localized:
            self.assertIn(order.order_id, localized_text)
            self.assertIn(order.item, localized_text)
        self.assertIn('GBP 32.45', localized_text)
        self.assertNotIn('\ufffd', localized_text)

    def test_pagination_retains_last_order_and_repeated_headings(self):
        source = HEADER + ''.join(f'ORDER-{i:04},Long fictional caf\u00e9 item with a clear description {i},1,0.25\n' for i in range(1, 121))
        pages = PdfReader(BytesIO(render_report(clean_rows(source)))).pages
        self.assertGreater(len(pages), 1)
        extracted = [p.extract_text() for p in pages]
        self.assertIn('ORDER-0120', '\n'.join(extracted))
        self.assertIn('GBP 30.00', '\n'.join(extracted))
        self.assertIn('caf\u00e9', '\n'.join(extracted))
        for index, text in enumerate(extracted, 1):
            self.assertIn(f'Page {index}', text)
            if 'ORDER-00' in text or 'ORDER-01' in text:
                self.assertIn('UNIT / GBP', text)

    def test_cli_errors_preserve_input_and_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, target = root / 'orders.csv', root / 'report.pdf'
            original = (ROOT / 'sample-orders.csv').read_bytes()
            source.write_bytes(original)
            count, total = convert(source, target)
            self.assertEqual((count, total), (3, Decimal('32.45')))
            report = target.read_bytes()
            result = subprocess.run([sys.executable, str(ROOT / 'report_orders.py'), '--input', str(source), '--output', str(target)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertIn('already exists', result.stderr)
            self.assertEqual(target.read_bytes(), report)
            self.assertEqual(source.read_bytes(), original)
            with self.assertRaises(InputError):
                convert(source, source)
            invalid = root / 'invalid.csv'
            invalid.write_text(HEADER + 'A,Missing price,1,\n', encoding='utf-8')
            missing = root / 'must-not-exist.pdf'
            with self.assertRaises(InputError):
                convert(invalid, missing)
            self.assertFalse(missing.exists())
            invalid.write_text(HEADER + 'A,\u4e66\u672c,1,2\n', encoding='utf-8')
            with self.assertRaisesRegex(InputError, 'report font'):
                convert(invalid, missing)
            self.assertFalse(missing.exists())


if __name__ == '__main__':
    unittest.main()
