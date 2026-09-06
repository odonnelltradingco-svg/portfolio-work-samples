# Order CSV cleanup — original Python sample

By Pierce Odonnell. All orders and customer names in this sample are fictional.

This small, reproducible workflow accepts an order export, separates valid records from exceptions and writes a summary that can be traced back to the source lines. Python 3.10 or newer is required; no third-party packages, accounts or network connection are needed.

## Run it

From this folder:

```text
python clean_orders.py sample-orders.csv --output my-results
python -m unittest -v
```

Choose a new output folder on each run. Existing folders are deliberately refused. The input file is never modified. A completed run with rejected records is successful: inspect the exceptions before using the cleaned data. Invalid headers, malformed CSV and unreadable files fail with an error.

## Included evidence

- `sample-orders.csv`: 12 input records, including six deliberate problems.
- `expected-results/cleaned-orders.csv`: six accepted records, with normalized values and source line numbers.
- `expected-results/exceptions.json`: six rejected records, their original values and specific reasons.
- `expected-results/summary.json`: four paid orders with $89.75 collected revenue; $19.95 pending and $9.00 refunded are separate.
- `test_clean_orders.py`: checks reconciliation, exact decimal math, normalization, schema errors, invalid values, duplicate handling, line numbers, CSV quoting and overwrite protection.

## Decisions made explicit

The schema is exactly `order_id,date,customer,quantity,unit_price,status`. Header case and surrounding spaces are normalized. Text values are trimmed and status is lowercased. Quantities must be positive whole numbers; USD prices are nonnegative with no more than two decimals. Dates must be real dates written as YYYY-MM-DD. Status is paid, pending or refunded.

Duplicate IDs are flagged, including when the earlier occurrence is invalid, so an ambiguous business record is never silently substituted. Missing or invalid values are not filled in. Customer strings that start like spreadsheet formulas, or contain control characters, are quarantined. Exceptions stay in JSON to preserve raw values without turning them into spreadsheet cells.

Only accepted paid orders contribute to collected revenue. Pending and refunded values are reported separately. No tax, fees, costs or profit are inferred. Blank records are reported as exceptions. The example is bounded to 2 MB and 10,000 records.

This is a focused portfolio demonstration. A client delivery would agree the actual column map, business rules, volume, privacy requirements and destination first. This sample is not connected to email, cloud storage, a scheduler or a production accounting system.

Live work: https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site
Studio: https://odonnellos.online/studio
For Upwork projects, contact and hire through https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be
