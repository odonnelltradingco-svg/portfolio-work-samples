"""Conservative CSV job-tracker cleanup. Python 3.10+; standard library only."""
from __future__ import annotations

import argparse
import csv
from datetime import date
import hashlib
import io
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit

FIELDS = ['job_id', 'job_title', 'client', 'posting_url', 'status', 'posted_date',
          'applied_date', 'next_action_date', 'next_action']
ALIASES = {'saved': 'Saved', 'open': 'Saved', 'applied': 'Applied',
           'submitted': 'Applied', 'interview': 'Interviewing',
           'interviewing': 'Interviewing', 'offer': 'Offer', 'offered': 'Offer',
           'closed': 'Closed', 'expired': 'Expired'}


def normalize(row: dict) -> tuple[dict, list[str]]:
    clean = {key: row.get(key, '').strip() for key in FIELDS}
    issues = []
    if not clean['job_title']:
        issues.append('Missing job title')
    if not clean['client']:
        issues.append('Missing client')
    if clean['posting_url']:
        try:
            url = urlsplit(clean['posting_url'])
            if url.scheme.lower() not in ('http', 'https') or not url.hostname or url.username or url.password:
                raise ValueError('Not a public HTTP URL')
            # Only normalize scheme/host. Preserve path case, query and fragment.
            clean['posting_url'] = urlunsplit((url.scheme.lower(), url.netloc.lower(), url.path, url.query, url.fragment))
        except ValueError:
            issues.append('Invalid posting URL')
    if not clean['job_id'] and not clean['posting_url']:
        issues.append('Missing job ID and posting URL')
    status = ALIASES.get(clean['status'].lower())
    if status is None:
        issues.append('Unrecognized status')
    else:
        clean['status'] = status
    for field in ('posted_date', 'applied_date', 'next_action_date'):
        if not clean[field]:
            continue
        try:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', clean[field]):
                raise ValueError('Use ISO date')
            date.fromisoformat(clean[field])
        except ValueError:
            issues.append('Invalid ' + field.replace('_', ' '))
    return clean, issues


def analyze(text: str) -> dict:
    reader = csv.DictReader(io.StringIO(text.lstrip('\ufeff')))
    if reader.fieldnames != FIELDS:
        raise ValueError('Expected these exact columns: ' + ', '.join(FIELDS))
    rows = []
    for index, row in enumerate(reader, 2):
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f'Incorrect field count at data record {index - 1}')
        clean, issues = normalize(row)
        rows.append({'source_record': index - 1, 'original': row, 'clean': clean, 'issues': issues})

    # Connected identity groups catch same-ID or same-URL collisions, even a chain.
    parent = list(range(len(rows)))
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    keys = {}
    for i, row in enumerate(rows):
        for field in ('job_id', 'posting_url'):
            value = row['clean'][field]
            if value:
                key = (field, value)
                if key in keys:
                    parent[root(i)] = root(keys[key])
                else:
                    keys[key] = i
    groups = {}
    for i in range(len(rows)):
        groups.setdefault(root(i), []).append(i)

    for indices in groups.values():
        group = [rows[i] for i in indices]
        conflict = len(group) > 1 and any(row['clean'] != group[0]['clean'] for row in group[1:])
        invalid = any(row['issues'] for row in group)
        for position, row in enumerate(group):
            if conflict or invalid:
                row['bucket'] = 'Review'
                reasons = row['issues'][:]
                if conflict:
                    reasons.append('Conflicting records share a job ID or posting URL; confirm the correct details')
                elif invalid and not reasons:
                    reasons.append('Related identity group contains an invalid record')
                row['reason'] = '; '.join(reasons)
            elif position:
                row['bucket'] = 'Archive'
                row['reason'] = f"Exact normalized duplicate of source record {group[0]['source_record']}"
            elif row['clean']['status'] in ('Closed', 'Expired'):
                row['bucket'] = 'Archive'
                row['reason'] = 'Source explicitly marked ' + row['clean']['status'].lower()
            else:
                row['bucket'] = 'Active'
                row['reason'] = 'Recognized active status; no identity conflict'
    return {
        'source_records': len(rows),
        'counts': {bucket: sum(row['bucket'] == bucket for row in rows) for bucket in ('Active', 'Archive', 'Review')},
        'rows': rows,
    }


def csv_literal(value):
    """Keep formula-like text literal in generated spreadsheet-ready CSV files."""
    text = str(value)
    return "'" + text if text.lstrip().startswith(('=', '+', '-', '@')) or text.startswith(('\t', '\r', '\n')) else text


def write_outputs(source: Path, output: Path) -> dict:
    raw = source.read_bytes()
    result = analyze(raw.decode('utf-8-sig'))
    result['source_sha256'] = hashlib.sha256(raw).hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    (output / 'decisions.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    for bucket in ('Active', 'Archive', 'Review'):
        with (output / f'{bucket.lower()}.csv').open('w', encoding='utf-8', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['source_record', *FIELDS, 'reason'])
            for row in result['rows']:
                if row['bucket'] == bucket:
                    writer.writerow([row['source_record'], *[csv_literal(row['clean'][key]) for key in FIELDS], row['reason']])
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, default=Path('output'))
    args = parser.parse_args()
    result = write_outputs(args.source, args.output)
    print(json.dumps({'source_records': result['source_records'], 'counts': result['counts']}, indent=2))
