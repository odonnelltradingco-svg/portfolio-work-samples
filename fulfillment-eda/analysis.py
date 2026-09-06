"""Reviewable Pandas cleanup and descriptive analysis. No network or client data."""
from decimal import Decimal
import hashlib
from pathlib import Path

import numpy as np
import pandas as pd

COLUMNS = ['order_id', 'ordered_at', 'channel', 'status', 'quantity', 'unit_price', 'shipping_days']
CHANNELS = ['Direct', 'Marketplace', 'Partner', 'Unknown']
STATUSES = ['paid', 'pending', 'refunded']


def read_orders(path):
    path = Path(path)
    if path.stat().st_size > 2_000_000:
        raise ValueError('This demonstration accepts CSV files up to 2 MB.')
    raw = pd.read_csv(path, dtype=str, keep_default_na=False, skip_blank_lines=False)
    if len(raw) > 10_000 or list(raw.columns) != COLUMNS:
        raise ValueError('Expected seven documented columns and at most 10,000 data records.')
    return raw


def clean_orders(raw):
    """Return accepted rows and review rows without modifying the raw DataFrame.

    Keep the first occurrence of an ID; flag subsequent occurrences even when
    the first one is invalid. Never auto-delete the original or guess values.
    Record numbers are one-based data records, not physical CSV line numbers.
    """
    if list(raw.columns) != COLUMNS:
        raise ValueError('Unexpected input columns.')
    original = raw.copy(deep=True).reset_index(drop=True)
    work = original.apply(lambda s: s.fillna('').astype(str).str.strip())
    issues = pd.DataFrame(index=work.index)
    issues['invalid_order_id'] = ~work.order_id.str.fullmatch(r'F-\d{4}', na=False)
    issues['duplicate_order_id'] = work.order_id.ne('') & work.order_id.duplicated(keep='first')
    dates = pd.to_datetime(work.ordered_at, format='%Y-%m-%d', errors='coerce')
    issues['invalid_date'] = dates.isna() | ~work.ordered_at.str.fullmatch(r'\d{4}-\d{2}-\d{2}')
    work['channel'] = work.channel.str.title().replace('', 'Unknown')
    issues['invalid_channel'] = ~work.channel.isin(CHANNELS)
    work['status'] = work.status.str.lower()
    issues['invalid_status'] = ~work.status.isin(STATUSES)
    issues['invalid_quantity'] = ~work.quantity.str.fullmatch(r'[1-9]\d{0,3}')
    # Integers represent cents throughout totals. Floats are used only in charts/statistics.
    issues['invalid_unit_price'] = ~work.unit_price.str.fullmatch(r'(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?')
    shipping = pd.to_numeric(work.shipping_days, errors='coerce')
    issues['invalid_shipping_days'] = work.shipping_days.ne('') & (
        ~work.shipping_days.str.fullmatch(r'(?:0|[1-9]\d{0,2})(?:\.\d)?')
        | shipping.isna() | ~shipping.between(0, 365)
    )
    rejected = issues.any(axis=1)
    review = original.loc[rejected].copy()
    review.insert(0, 'record_number', review.index + 1)
    review['reasons'] = ['; '.join(row.index[row]) for _, row in issues.loc[rejected].iterrows()]
    accepted = work.loc[~rejected].copy()
    accepted.insert(0, 'record_number', accepted.index + 1)
    accepted['ordered_at'] = dates.loc[~rejected]
    accepted['quantity'] = accepted.quantity.astype('int64')
    accepted['unit_price_cents'] = accepted.unit_price.map(lambda value: int(Decimal(value) * 100)).astype('int64')
    accepted['order_value_cents'] = accepted.quantity * accepted.unit_price_cents
    accepted['shipping_days'] = shipping.loc[~rejected]
    accepted['channel_missing'] = work.loc[~rejected].channel.eq('Unknown')
    # Units and price caps keep the 10,000-row aggregate inside int64.
    assert len(raw) == len(accepted) + len(review)
    assert accepted.order_id.is_unique
    assert set(accepted.record_number).isdisjoint(review.record_number)
    return accepted.reset_index(drop=True), review.reset_index(drop=True)


def analyze(accepted, review, raw_count):
    """Describe this fictional sample; do not infer causal or population effects."""
    paid = accepted.loc[accepted.status.eq('paid')].copy()
    if paid.empty:
        raise ValueError('At least one paid order is needed for this EDA demonstration.')
    values = paid.order_value_cents.to_numpy(dtype=np.int64)
    q1, q3 = np.quantile(values.astype(float), [0.25, 0.75], method='linear')
    fence = q3 + 1.5 * (q3 - q1)
    paid['high_value_review'] = paid.order_value_cents.gt(fence)
    status = accepted.groupby('status', observed=True).agg(
        orders=('order_id', 'size'), value_cents=('order_value_cents', 'sum')
    ).reindex(STATUSES, fill_value=0)
    channels = paid.groupby('channel', observed=True).agg(
        orders=('order_id', 'size'), paid_value_cents=('order_value_cents', 'sum'),
        shipping_observations=('shipping_days', 'count'),
        median_shipping_days=('shipping_days', 'median')
    ).reindex(CHANNELS)
    for col in ['orders', 'paid_value_cents', 'shipping_observations']:
        channels[col] = channels[col].fillna(0).astype('int64')
    channels['missing_shipping'] = channels.orders - channels.shipping_observations
    date_index = pd.date_range(accepted.ordered_at.min(), accepted.ordered_at.max(), freq='D')
    daily = paid.groupby('ordered_at').agg(orders=('order_id', 'size'), paid_value_cents=('order_value_cents', 'sum')).reindex(date_index, fill_value=0)
    daily.index.name = 'ordered_at'
    total = int(values.sum())
    maximum = int(values.max())
    maximum_share = maximum / total if total else 0
    summary = {
        'input_records': int(raw_count), 'accepted_records': len(accepted),
        'review_records': len(review), 'paid_orders': len(paid),
        'paid_value_cents': total, 'median_paid_value_cents': float(np.median(values)),
        'mean_paid_value_cents': float(np.mean(values)),
        'largest_paid_order_cents': maximum, 'largest_paid_order_share': maximum_share,
        'high_value_review_count': int(paid.high_value_review.sum()),
        'upper_iqr_fence_cents': float(fence),
        'unknown_channel_orders': int(accepted.channel_missing.sum()),
        'paid_shipping_observations': int(paid.shipping_days.notna().sum()),
        'paid_shipping_missing': int(paid.shipping_days.isna().sum()),
        'status_counts': {str(k): int(v) for k, v in status.orders.items()},
        'status_value_cents': {str(k): int(v) for k, v in status.value_cents.items()},
        'notes': ['Fictional, seeded demonstration; no customer data or business outcomes.',
                  'Paid order value is not profit, net cash flow, tax-adjusted revenue or accounting advice.',
                  'Pending and refunded records remain separate; no refund is subtracted a second time.',
                  'Missing shipping times are excluded only from shipping summaries; denominators are reported.',
                  'High-value flags prompt review; all valid paid records stay in the totals.'],
    }
    assert raw_count == len(accepted) + len(review)
    assert sum(summary['status_counts'].values()) == len(accepted)
    assert int(channels.paid_value_cents.sum()) == total == int(daily.paid_value_cents.sum())
    return {'summary': summary, 'paid': paid, 'status': status, 'channels': channels, 'daily': daily}


def input_sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def usd(cents):
    return f'${Decimal(str(cents)) / 100:,.2f}'
