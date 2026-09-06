"""Failure and repeat-run checks for the local folder-processing extension."""
from contextlib import closing
from hashlib import sha256
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import process_folder as batch

ROOT = Path(__file__).resolve().parent
SAMPLE = (ROOT / 'sample-orders.csv').read_bytes()


class FolderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.inbox, self.outbox = self.root / 'inbox', self.root / 'outbox'
        self.inbox.mkdir()
        self.source = self.inbox / 'daily.csv'
        self.source.write_bytes(SAMPLE)

    def run_folder(self):
        return batch.run_batch(self.inbox, self.outbox)

    def test_first_run_repeat_and_renamed_copy_share_one_report(self):
        first = self.run_folder()
        self.assertEqual(first['summary'], {'created': 1, 'skipped': 0, 'recovered': 0, 'failed': 0})
        self.assertEqual((first['results'][0]['orders'], first['results'][0]['total_gbp']), (3, '32.45'))
        target = self.outbox / first['results'][0]['report']
        original, modified = target.read_bytes(), target.stat().st_mtime_ns
        (self.inbox / 'renamed.csv').write_bytes(SAMPLE)
        repeated = self.run_folder()
        self.assertEqual(repeated['summary']['skipped'], 2)
        self.assertEqual(len(list(self.outbox.glob('*.pdf'))), 1)
        self.assertEqual((target.read_bytes(), target.stat().st_mtime_ns), (original, modified))
        self.assertEqual(self.source.read_bytes(), SAMPLE)

    def test_changed_contents_at_same_name_get_a_new_report(self):
        old_name = self.run_folder()['results'][0]['report']
        old_pdf = (self.outbox / old_name).read_bytes()
        self.source.write_bytes(SAMPLE.replace(b'12.95', b'15.95'))
        result = self.run_folder()['results'][0]
        self.assertEqual((result['status'], result['total_gbp']), ('created', '35.45'))
        self.assertNotEqual(result['report'], old_name)
        self.assertEqual((self.outbox / old_name).read_bytes(), old_pdf)

    def test_invalid_files_do_not_hide_good_results_or_echo_row_contents(self):
        bad = b'order_id,item,quantity,unit_price\nX,PRIVATE-ROW-CONTENT,NaN,2\n'
        (self.inbox / 'broken.csv').write_bytes(bad)
        (self.inbox / 'encoding.csv').write_bytes(b'\xff\xfe')
        (self.inbox / 'unfinished.part').write_bytes(bad)
        result = self.run_folder()
        self.assertEqual((result['files_seen'], result['summary']['created'], result['summary']['failed']), (3, 1, 2))
        self.assertNotIn('PRIVATE-ROW-CONTENT', json.dumps(result))
        self.assertEqual((self.inbox / 'broken.csv').read_bytes(), bad)
        self.assertEqual(len(list(self.outbox.glob('*.pdf'))), 1)

    def test_changed_report_is_preserved_and_reported_for_review(self):
        target = self.outbox / self.run_folder()['results'][0]['report']
        target.write_bytes(b'Human-edited report; do not replace')
        result = self.run_folder()['results'][0]
        self.assertEqual(result['status'], 'failed')
        self.assertIn('has changed', result['error'])
        self.assertEqual(target.read_bytes(), b'Human-edited report; do not replace')

    def test_missing_output_is_reproduced_from_the_same_input(self):
        target = self.outbox / self.run_folder()['results'][0]['report']
        previous = target.read_bytes()
        target.unlink()
        self.assertEqual(self.run_folder()['results'][0]['status'], 'recovered')
        self.assertEqual(target.read_bytes(), previous)

    def test_conflicting_untracked_output_is_never_replaced(self):
        self.outbox.mkdir()
        target = self.outbox / f'report-{sha256(SAMPLE).hexdigest()}.pdf'
        target.write_bytes(b'unrelated output')
        result = self.run_folder()['results'][0]
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(target.read_bytes(), b'unrelated output')
        with closing(sqlite3.connect(self.outbox / batch.DATABASE)) as connection:
            self.assertEqual(connection.execute('SELECT COUNT(*) FROM reports').fetchone()[0], 0)

    def test_interrupted_batch_recovers_published_output_before_history_commit(self):
        (self.inbox / 'second.csv').write_bytes(SAMPLE.replace(b'12.95', b'15.95'))
        original_renderer = batch.render_report
        calls = 0

        def interrupt_second(orders):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError('simulated interruption')
            return original_renderer(orders)

        with patch.object(batch, 'render_report', side_effect=interrupt_second):
            with self.assertRaisesRegex(RuntimeError, 'simulated interruption'):
                self.run_folder()
        preserved = list(self.outbox.glob('*.pdf'))
        self.assertEqual(len(preserved), 1)
        original = preserved[0].read_bytes()
        result = self.run_folder()
        self.assertEqual((result['summary']['recovered'], result['summary']['created']), (1, 1))
        self.assertEqual(preserved[0].read_bytes(), original)

    def test_atomic_publication_failure_leaves_no_partial_report(self):
        with patch.object(batch.os, 'link', side_effect=OSError(5, 'simulated local disk error')):
            result = self.run_folder()
        self.assertEqual(result['summary']['failed'], 1)
        self.assertEqual(list(self.outbox.glob('*.pdf')), [])
        self.assertEqual(list(self.outbox.glob('.pending-*')), [])
        self.assertEqual(self.run_folder()['summary']['created'], 1)

    def test_overlapping_run_fails_fast_without_changing_reports(self):
        self.run_folder()
        connection = sqlite3.connect(self.outbox / batch.DATABASE, isolation_level=None)
        self.addCleanup(connection.close)
        connection.execute('BEGIN IMMEDIATE')
        result = subprocess.run([sys.executable, str(ROOT / 'process_folder.py'),
                                 '--input-dir', str(self.inbox), '--output-dir', str(self.outbox)],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 2)
        self.assertIn('another run', result.stderr)
        self.assertEqual(len(list(self.outbox.glob('*.pdf'))), 1)
        connection.rollback()

    def test_unrelated_history_database_is_left_unchanged(self):
        self.outbox.mkdir()
        history = self.outbox / batch.DATABASE
        with closing(sqlite3.connect(history)) as connection:
            connection.execute('CREATE TABLE unrelated(value TEXT)')
            connection.execute("INSERT INTO unrelated VALUES ('keep')")
            connection.commit()
        original = history.read_bytes()
        with self.assertRaises(batch.BatchError):
            self.run_folder()
        self.assertEqual(history.read_bytes(), original)
        self.assertEqual(list(self.outbox.glob('*.pdf')), [])

    def test_folder_configuration_and_file_limits_fail_before_processing(self):
        for input_dir, output_dir in [(self.root / 'missing', self.outbox), (self.inbox, self.inbox)]:
            with self.subTest(input=input_dir), self.assertRaises(batch.BatchError):
                batch.run_batch(input_dir, output_dir)
        with patch.object(batch, 'MAX_FILES', 0), self.assertRaises(batch.BatchError):
            self.run_folder()
        self.assertFalse(self.outbox.exists())
        self.assertEqual(self.source.read_bytes(), SAMPLE)

    def test_cli_prints_readable_json_and_nonzero_for_partial_failure(self):
        (self.inbox / 'invalid.csv').write_text('incorrect header\n', encoding='utf-8')
        command = [sys.executable, str(ROOT / 'process_folder.py'), '--input-dir', str(self.inbox),
                   '--output-dir', str(self.outbox)]
        first = subprocess.run(command, capture_output=True, text=True, timeout=15)
        self.assertEqual(first.returncode, 2)
        self.assertEqual(json.loads(first.stdout)['summary']['created'], 1)
        (self.inbox / 'invalid.csv').unlink()
        second = subprocess.run(command, capture_output=True, text=True, timeout=15)
        self.assertEqual(second.returncode, 0)
        self.assertEqual(json.loads(second.stdout)['summary']['skipped'], 1)


if __name__ == '__main__':
    unittest.main()
