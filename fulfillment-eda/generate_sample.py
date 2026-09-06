"""Create a deterministic, fictional dataset for the portfolio demonstration."""
from pathlib import Path
from datetime import date, timedelta
import csv
import random


def sample_rows():
    rng = random.Random(20260906)
    rows = []
    for i in range(240):
        channel = rng.choices(['Direct', 'Marketplace', 'Partner'], [55, 30, 15])[0]
        status = rng.choices(['paid', 'pending', 'refunded'], [78, 14, 8])[0]
        days = max(0.5, round(rng.gauss({'Direct': 2.5, 'Marketplace': 4.2, 'Partner': 3.1}[channel], 1.0), 1))
        rows.append({
            'order_id': f'F-{i+1:04}',
            'ordered_at': (date(2026, 8, 1) + timedelta(days=i//8)).isoformat(),
            'channel': '' if i % 19 == 0 else (f' {channel.lower()} ' if i % 11 == 0 else channel),
            'status': f' {status.upper()} ' if i % 13 == 0 else status,
            'quantity': str(rng.randint(1, 5)),
            'unit_price': rng.choice(['12.50', '19.95', '29.00', '49.50', '89.99']),
            'shipping_days': '' if status != 'paid' or i % 23 == 0 else str(days),
        })
    # Explicitly planted quality problems, separate from the random sample.
    for row, column, value in [(2, 'order_id', ''), (17, 'ordered_at', '2026-02-30'),
                               (28, 'quantity', '-1'), (39, 'unit_price', 'unknown'),
                               (50, 'status', 'settled'), (61, 'shipping_days', '-2'),
                               (72, 'quantity', '')]:
        rows[row][column] = value
    # A valid, intentionally extreme order. Retain it and explain its influence.
    rows[99].update(status='paid', quantity='1', unit_price='9999.00', shipping_days='3.5')
    rows.extend(dict(rows[i]) for i in (5, 20, 35))
    return rows


if __name__ == '__main__':
    target = Path(__file__).with_name('fictional-orders.csv')
    rows = sample_rows()
    with target.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f'Wrote {len(rows)} fictional records to {target.name}.')
