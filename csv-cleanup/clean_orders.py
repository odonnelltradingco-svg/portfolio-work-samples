"""Original portfolio sample by Pierce Odonnell. Standard-library Python only."""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
from collections import Counter
from datetime import date
from decimal import Decimal
from pathlib import Path

FIELDS = ('order_id', 'date', 'customer', 'quantity', 'unit_price', 'status')
OUTPUT_FIELDS = (*FIELDS, 'total_usd', 'source_line')
MAX_BYTES = 2_000_000
MAX_ROWS = 10_000


def analyze(text: str) -> dict:
    """Return normalized rows, exceptions and reconciled totals. Never write input."""
    if len(text.encode('utf-8')) > MAX_BYTES:
        raise ValueError('Input exceeds the 2 MB sample limit')
    reader = csv.reader(io.StringIO(text.lstrip('\ufeff')), strict=True)
    try:
        raw_header = next(reader)
    except StopIteration:
        raise ValueError('Input has no header') from None
    header = [value.strip().lower() for value in raw_header]
    if len(header) != len(set(header)):
        raise ValueError('Duplicate column names after normalization')
    if set(header) != set(FIELDS):
        raise ValueError('Expected exactly these columns: ' + ', '.join(FIELDS))
    records, exceptions, seen = [], [], set()
    normalizations, total_rows = 0, 0
    previous_line = reader.line_num
    for row in reader:
        start_line, previous_line = previous_line + 1, reader.line_num
        total_rows += 1
        if total_rows > MAX_ROWS:
            raise ValueError('Input exceeds the 10,000-record sample limit')
        if not row or all(not cell.strip() for cell in row):
            exceptions.append({'source_line': start_line, 'reason': 'Empty record', 'raw_values': row})
            continue
        reasons = []
        if len(row) != len(header):
            exceptions.append({'source_line': start_line, 'reason': 'Wrong number of columns', 'raw_values': row})
            continue
        raw = dict(zip(header, row))
        record = {key: value.strip() for key, value in raw.items()}
        record['status'] = record['status'].lower()
        normalized = record != raw
        order = record['order_id']
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,63}', order):
            reasons.append('Order ID must be 1–64 letters, digits, hyphens or underscores')
        elif order in seen:
            reasons.append('Duplicate order ID; first occurrence retained for review')
        seen.add(order)
        customer = record['customer']
        if not customer or len(customer) > 160:
            reasons.append('Customer must contain 1–160 characters')
        elif customer.startswith(('=', '+', '-', '@')) or any(ord(c) < 32 for c in customer):
            reasons.append('Customer contains spreadsheet formula or control characters')
        try:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', record['date']):
                raise ValueError()
            date.fromisoformat(record['date'])
        except ValueError:
            reasons.append('Date must be a real calendar date in YYYY-MM-DD format')
        if not re.fullmatch(r'[1-9]\d{0,5}', record['quantity']):
            reasons.append('Quantity must be a whole number from 1 to 999999')
        if not re.fullmatch(r'\d{1,7}(\.\d{1,2})?', record['unit_price']):
            reasons.append('Unit price must be nonnegative USD with at most two decimal places')
        if record['status'] not in {'paid', 'pending', 'refunded'}:
            reasons.append('Status must be paid, pending or refunded')
        if reasons:
            exceptions.append({'source_line': start_line, 'reason': '; '.join(reasons), 'raw_values': row})
            continue
        record['quantity'] = int(record['quantity'])
        unit = Decimal(record['unit_price'])
        record['unit_price'] = f'{unit:.2f}'
        record['total_usd'] = f'{unit * record["quantity"]:.2f}'
        record['source_line'] = start_line
        records.append(record)
        normalizations += int(normalized)
    status_counts = Counter(r['status'] for r in records)
    sums = {status: f'{sum((Decimal(r["total_usd"]) for r in records if r["status"] == status), Decimal(0)):.2f}'
            for status in ('paid', 'pending', 'refunded')}
    return {'cleaned_rows': records, 'exceptions': exceptions, 'summary': {
        'currency': 'USD', 'input_records': total_rows, 'accepted_records': len(records),
        'rejected_records': len(exceptions), 'accepted_records_with_whitespace_or_case_cleanup': normalizations,
        'status_counts': {s: status_counts[s] for s in sums}, 'order_value_by_status_usd': sums,
        'collected_revenue_usd': sums['paid'],
        'notes': ['Fictional portfolio data; this is not an accounting system.',
                  'Only accepted paid rows contribute to collected revenue.',
                  'Duplicate IDs are flagged even if the first occurrence is invalid.',
                  'Original values remain in the exceptions JSON; no values are imputed.']}}


def write_results(result: dict, folder: Path) -> None:
    # Refuse an existing destination so a rerun cannot silently replace previous evidence.
    folder.mkdir(parents=True, exist_ok=False)
    with (folder / 'cleaned-orders.csv').open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(result['cleaned_rows'])
    for filename, value in [('exceptions.json', result['exceptions']), ('summary.json', result['summary'])]:
        (folder / filename).write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate an order CSV and produce traceable cleanup outputs.')
    parser.add_argument('input', type=Path)
    parser.add_argument('--output', type=Path, required=True, help='A new directory; existing directories are refused')
    args = parser.parse_args()
    try:
        if args.input.stat().st_size > MAX_BYTES:
            raise ValueError('Input exceeds the 2 MB sample limit')
        result = analyze(args.input.read_text(encoding='utf-8-sig'))
        write_results(result, args.output)
    except (ValueError, csv.Error, OSError, UnicodeError) as error:
        parser.exit(2, f'No completed report: {error}\n')
    summary = result['summary']
    print(f"Accepted {summary['accepted_records']}; rejected {summary['rejected_records']}. See {args.output}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
