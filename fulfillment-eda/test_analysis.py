import unittest
from decimal import Decimal
import pandas as pd
from analysis import COLUMNS, clean_orders, analyze, read_orders
from generate_sample import sample_rows


class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.raw = pd.DataFrame(sample_rows(), columns=COLUMNS)

    def test_partition_and_original_values(self):
        original = self.raw.copy(deep=True)
        accepted, review = clean_orders(self.raw)
        pd.testing.assert_frame_equal(self.raw, original)
        self.assertEqual((len(accepted), len(review)), (233, 10))
        self.assertEqual(set(accepted.record_number) | set(review.record_number), set(range(1, 244)))
        self.assertEqual(review.loc[review.record_number.eq(40), 'unit_price'].item(), 'unknown')

    def test_duplicate_policy_even_when_first_invalid(self):
        raw = self.raw.iloc[[5, 5]].copy().reset_index(drop=True)
        raw.loc[0, 'quantity'] = '-1'
        accepted, review = clean_orders(raw)
        self.assertTrue(accepted.empty)
        self.assertIn('duplicate_order_id', review.iloc[1].reasons)

    def test_missing_channel_and_shipping_are_not_guessed(self):
        raw = self.raw.iloc[[5]].copy()
        raw.loc[:, ['channel', 'shipping_days', 'status']] = ['', '', ' PAID ']
        accepted, review = clean_orders(raw)
        self.assertTrue(review.empty)
        self.assertEqual(accepted.iloc[0].channel, 'Unknown')
        self.assertTrue(pd.isna(accepted.iloc[0].shipping_days))
        result = analyze(accepted, review, 1)
        self.assertEqual(result['summary']['paid_shipping_missing'], 1)
        self.assertEqual(result['summary']['paid_shipping_observations'], 0)

    def test_exact_status_totals_and_outlier_retained(self):
        accepted, review = clean_orders(self.raw)
        result = analyze(accepted, review, len(self.raw))
        paid = accepted.loc[accepted.status.eq('paid')]
        independent = sum(int(Decimal(row.unit_price) * 100) * int(row.quantity) for row in paid.itertuples())
        self.assertEqual(result['summary']['paid_value_cents'], independent)
        extreme = result['paid'].loc[result['paid'].order_id.eq('F-0100')].iloc[0]
        self.assertTrue(extreme.high_value_review)
        self.assertEqual(extreme.order_value_cents, 999900)
        self.assertEqual(sum(result['summary']['status_counts'].values()), 233)

    def test_multiple_failures_remain_reviewable(self):
        raw = self.raw.iloc[[5]].copy()
        raw.loc[:, ['order_id', 'ordered_at', 'unit_price', 'shipping_days']] = ['=2+2', '2026-8-1', 'NaN', 'Infinity']
        accepted, review = clean_orders(raw)
        self.assertTrue(accepted.empty)
        for reason in ['invalid_order_id', 'invalid_date', 'invalid_unit_price', 'invalid_shipping_days']:
            self.assertIn(reason, review.iloc[0].reasons)


if __name__ == '__main__':
    unittest.main()
