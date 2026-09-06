"""Process a local CSV inbox once, preserving inputs and recording report history."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import sqlite3
import stat
import sys
import tempfile

from report_orders import InputError, MAX_BYTES, clean_rows, order_total, render_report

APP_ID = 0x4F445046
MAX_FILES = 100
MAX_PDF_BYTES = 50_000_000
DATABASE = 'batch-history.sqlite3'


class BatchError(ValueError):
    """A readable configuration or history error that stops the batch."""


def digest(data: bytes) -> str:
    return sha256(data).hexdigest()


def read_regular(path: Path, limit: int) -> bytes:
    if path.is_symlink() or not stat.S_ISREG(path.stat().st_mode):
        raise InputError('Only regular files are accepted; symbolic links are not followed.')
    with path.open('rb') as handle:
        before = os.fstat(handle.fileno())
        raw = handle.read(limit + 1)
        after = os.fstat(handle.fileno())
    if len(raw) > limit:
        raise InputError('File exceeds the configured size limit.')
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise InputError('File changed while being read; finish the upload and try again.')
    return raw


def publish_exclusive(path: Path, content: bytes) -> bool:
    """Publish a complete file without replacing an existing name; local disk only."""
    if len(content) > MAX_PDF_BYTES:
        raise InputError('Generated PDF exceeds the 50 MB demonstration limit.')
    if path.exists() or path.is_symlink():
        if read_regular(path, MAX_PDF_BYTES) != content:
            raise InputError('Existing report differs from the expected output; preserved for review.')
        return False
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.pending-', suffix='.pdf', delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        # Same-directory hard linking is atomic and fails if the destination exists.
        # It requires a local filesystem with hard-link support (e.g. NTFS/ext4).
        try:
            os.link(temporary, path)
        except FileExistsError:
            if read_regular(path, MAX_PDF_BYTES) != content:
                raise InputError('A conflicting report appeared; preserved for review.')
            return False
        return True
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def initialize_history(connection: sqlite3.Connection) -> None:
    application = connection.execute('PRAGMA application_id').fetchone()[0]
    version = connection.execute('PRAGMA user_version').fetchone()[0]
    tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    if application == 0 and version == 0 and not tables:
        connection.execute(f'PRAGMA application_id={APP_ID}')
        connection.execute('PRAGMA user_version=1')
        connection.execute('''CREATE TABLE reports (
            input_sha TEXT PRIMARY KEY, output_name TEXT NOT NULL, pdf_sha TEXT NOT NULL,
            order_count INTEGER NOT NULL, total_gbp TEXT NOT NULL, completed_at TEXT NOT NULL
        )''')
    elif application != APP_ID or version != 1:
        raise BatchError('History is not a supported batch database; leave it unchanged and use a new output folder.')


def process_one(source: Path, output: Path, connection: sqlite3.Connection) -> dict:
    raw = read_regular(source, MAX_BYTES)
    input_sha = digest(raw)
    name = f'report-{input_sha}.pdf'
    target = output / name
    existing = connection.execute(
        'SELECT output_name, pdf_sha, order_count, total_gbp FROM reports WHERE input_sha=?',
        (input_sha,)).fetchone()
    if existing:
        if existing[0] != name:
            raise InputError('History output name is inconsistent; preserved for review.')
        if target.exists() or target.is_symlink():
            if digest(read_regular(target, MAX_PDF_BYTES)) != existing[1]:
                raise InputError('Previously generated report has changed; preserved for review.')
            return {'file': source.name, 'status': 'skipped', 'report': name,
                    'orders': existing[2], 'total_gbp': existing[3]}
    try:
        orders = clean_rows(raw.decode('utf-8-sig'))
    except UnicodeDecodeError as exc:
        raise InputError('Input must be UTF-8 encoded.') from exc
    report = render_report(orders)
    report_sha = digest(report)
    if existing and existing[1] != report_sha:
        raise InputError('This generator cannot reproduce the recorded report; use the original version or review the history.')
    created = publish_exclusive(target, report)
    total = f'{order_total(orders):.2f}'
    if not existing:
        connection.execute('INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?)',
                           (input_sha, name, report_sha, len(orders), total,
                            datetime.now(timezone.utc).isoformat()))
    return {'file': source.name, 'status': 'created' if created and not existing else 'recovered',
            'report': name, 'orders': len(orders), 'total_gbp': total}


def run_batch(input_dir: Path, output_dir: Path) -> dict:
    input_dir, output_dir = input_dir.resolve(), output_dir.resolve()
    if not input_dir.is_dir():
        raise BatchError('Input folder must already exist.')
    if input_dir == output_dir:
        raise BatchError('Input and output folders must differ.')
    files = sorted((p for p in input_dir.iterdir() if p.suffix.lower() == '.csv'), key=lambda p: p.name)
    if len(files) > MAX_FILES:
        raise BatchError(f'At most {MAX_FILES} CSV files per run; divide the inbox before continuing.')
    output_dir.mkdir(parents=True, exist_ok=True)
    history = output_dir / DATABASE
    if history.is_symlink():
        raise BatchError('The history database must not be a symbolic link.')
    connection = sqlite3.connect(history, timeout=0, isolation_level=None)
    try:
        connection.execute('PRAGMA synchronous=FULL')
        # A single writer owns this output folder until commit. Overlapping scheduled
        # runs fail immediately instead of generating two sets of reports.
        connection.execute('BEGIN IMMEDIATE')
        initialize_history(connection)
        results = []
        for source in files:
            try:
                results.append(process_one(source, output_dir, connection))
            except InputError as exc:
                results.append({'file': source.name, 'status': 'failed', 'error': str(exc)})
            except OSError as exc:
                results.append({'file': source.name, 'status': 'failed',
                                'error': f'File operation failed (OS error {exc.errno}); check access and local-disk support.'})
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()
    return {'schema_version': 1, 'files_seen': len(files),
            'summary': {status: sum(row['status'] == status for row in results)
                        for status in ('created', 'skipped', 'recovered', 'failed')},
            'results': results}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    try:
        report = run_batch(args.input_dir, args.output_dir)
    except BatchError as exc:
        print(f'Batch not completed: {exc}', file=sys.stderr)
        return 2
    except sqlite3.OperationalError as exc:
        if 'locked' in str(exc).lower():
            print('Batch not completed: another run owns the history database; retry after it finishes.', file=sys.stderr)
        else:
            print('Batch not completed: history could not be opened or updated; check access and database integrity.', file=sys.stderr)
        return 2
    except (OSError, sqlite3.DatabaseError):
        print('Batch not completed: file or history error; inputs and existing reports were not overwritten.', file=sys.stderr)
        return 2
    print(json.dumps(report, indent=2))
    return 2 if report['summary']['failed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
