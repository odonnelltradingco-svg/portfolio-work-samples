# Fulfillment EDA - original portfolio demonstration

A complete, reproducible Python/Pandas analysis of **243 fictional order records**. Created by Pierce O'Donnell to demonstrate data-quality review, exploratory analysis and clear handoff. This is not client work or measured business performance.

## Start here

- Open `fulfillment-eda.ipynb` to read the executed notebook, including outputs and charts.
- Open `report.html` for a concise, standalone visual report. It needs no server or network.
- Review `expected-results/` to compare the delivered CSV files and exact totals.
- Read `analysis.py` for the reusable cleanup/analysis functions and `charts.py` for figure code.

## Run again

Tested with Python 3.12. Use a new virtual environment, then:

```text
python -m pip install -r requirements.txt
python -m unittest discover -p test_analysis.py -v
python -m nbconvert --to notebook --execute fulfillment-eda.ipynb --output fulfillment-eda-rerun.ipynb
```

Run from this folder. In an existing Jupyter environment, choose a kernel with the same dependencies and use **Restart Kernel and Run All Cells**. No credential or external service is required. The notebook does not change the input CSV. It creates a new output folder for each run, preserving earlier results.

`generate_sample.py` reproduces the seeded fictional input. It rewrites only `fictional-orders.csv`; run it only when intentionally regenerating the sample.

## Schema and decisions

The columns, in order, are `order_id`, `ordered_at`, `channel`, `status`, `quantity`, `unit_price`, and `shipping_days`. IDs are F-0001 style; dates are real ISO calendar dates. Quantity is a positive integer up to 9999; unit price is nonnegative USD with at most two decimal places and a maximum of 999999.99. Shipping is optional, nonnegative days, at most one decimal place and at most 365 days. Files are limited to 2 MB and 10,000 data records for this demonstration.

- **Duplicates:** retain the first occurrence; route later occurrences to review, including when the first occurrence is invalid. This is an explicit demonstration policy, not a universal deduplication rule.
- **Invalid required values:** quarantine with original values and every detected reason. Do not infer missing prices, IDs or quantities.
- **Missing channels:** retain as `Unknown`, visible in all channel counts.
- **Missing shipping:** retain the order; omit its missing time only from shipping summaries and show the observed denominator.
- **Outliers:** flag paid values above Q3 + 1.5 IQR for review. Retain them in all totals and charts.
- **Status:** summarize paid, pending and refunded separately. Paid order value is not profit, net cash flow or a full accounting measure.
- **Traceability:** record numbers refer to one-based CSV data records, not physical file line numbers. Monetary aggregates use integer cents.

## Scope of conclusions

The deliberately planted extreme order affects the mean, the daily peak and channel totals. The report shows that sensitivity without claiming the order is an error. Channel shipping comparisons describe this synthetic sample only. Random generation rules and planted missingness do not support causal claims, representative estimates, forecasts or business recommendations.

## References

[Pandas CSV input documentation](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) describes string-preserving input and missing-value controls. [Jupyter notebook execution documentation](https://nbclient.readthedocs.io/en/latest/client.html) describes executing a complete notebook with a fresh kernel. These references document the tools; the sample and findings are original.

Freelance contact: https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be
