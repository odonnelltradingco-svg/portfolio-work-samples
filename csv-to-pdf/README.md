# CSV in. Clear PDF out.

A runnable, original Python demonstration by Pierce O'Donnell. Turn the supplied fictional order CSV into a clean, paginated GBP report. Review the source, reproduce the result and inspect the validation rules before considering similar work for your own files.

[View the generated report](sample-report.pdf) · [Inspect the input](sample-orders.csv) · [Conversion source](report_orders.py) · [Ten behavior checks](test_report_orders.py)

[View the accented-text report](sample-accented-report.pdf) · [Inspect its UTF-8 input](sample-accented-orders.csv). This second fictional example preserves names such as Café crème, curly apostrophes and French quotation marks using the same portable font family.

## Run it

Use Python 3.12 in a virtual environment. No account, credentials, Windows fonts or network connection is needed after installing the dependencies.

```text
python -m venv .venv
```

Activate the environment with `.venv\Scripts\activate` on Windows, or `source .venv/bin/activate` on macOS/Linux. From this folder:

```text
python -m pip install -r requirements.txt
python report_orders.py --input sample-orders.csv --output my-report.pdf
python report_orders.py --input sample-accented-orders.csv --output my-accented-report.pdf
python -m unittest -v test_report_orders.py
```

Expected console result: `Created my-report.pdf: 3 validated orders; GBP 32.45.` Choose a new output name on each run. Existing output files are never overwritten. The parent output folder must already exist. The original CSV is never modified.

ReportLab generates the report; pypdf is used to inspect PDF contents in the tests. Dependency versions are recorded in `requirements.txt`.

## Follow the calculation

| Order | Quantity | Unit price / GBP | Line total / GBP |
| --- | ---: | ---: | ---: |
| DEMO-001 | 2 | 4.50 | 9.00 |
| DEMO-002 | 1 | 12.95 | 12.95 |
| DEMO-003 | 3 | 3.50 | 10.50 |
| **Total** | | | **32.45** |

The order ID on the first input row has surrounding whitespace; the report removes it. Calculations use `Decimal`, never binary floating point. Each line is rounded to two decimal places using `ROUND_HALF_UP`; the overall total sums those rounded lines. Prices with more than two decimal places remain visible at their supplied precision. Tax, shipping, discounts and currency conversion are outside this sample.

## Input rules

- A UTF-8 CSV with exactly `order_id`, `item`, `quantity`, `unit_price`; columns may appear in any order. A UTF-8 BOM and outer whitespace are accepted.
- Unique, case-sensitive order IDs after trimming. IDs allow 1-64 printable characters; item descriptions allow 1-160. Text must be representable by the built-in fonts' WinAnsi encoding: ASCII, many Western European accented letters, curly quotes and common punctuation work. The input file remains UTF-8, not Windows-1252. Quoted commas work.
- Other scripts, emoji, combining-character sequences and control characters are rejected before creating a PDF. There is no transliteration or guessed replacement. This is not full Unicode support; a broader font/character policy must be agreed for other input. Names retain their supplied characters after outer whitespace cleanup.
- Positive whole quantities from 1 to 1,000,000. Unit prices use an unsigned plain decimal, at most six decimal places and at most GBP 1,000,000,000. Scientific notation, currency symbols, negative values, NaN and infinity are rejected.
- At most 10,000 orders and a 5 MB input. Blank records, extra/missing fields, duplicate headers and malformed quoted fields are rejected. The entire file must pass before a report is rendered.
- Exit code 0 means success; exit code 2 means an input or file error. Validation errors identify the line or rule without repeating the raw record. No report is created for invalid input. Existing files, including the input itself, are protected.

## What is demonstrated

Portable report generation; validated input; exact monetary calculations; wrapped table cells; repeated headings on later pages; page numbers; an explicit fictional-data label; input and output protection. Ten tests cover the supplied amounts, BOM/reordered columns, quoted commas, line rounding, missing or duplicate headers, duplicate IDs, malformed records, invalid values, escaped PDF text, exact accented-text extraction, pagination and CLI overwrite handling. Unsupported characters fail before an output file is created.

The earlier application attachment remains a separate visual explanation of the same three-order example. This package is the portable generator and its own reproducible report. It is also separate from the 12-record `csv-cleanup` example, which exports CSV/JSON rather than PDF.

### Optional folder workflow

[Run the local folder-processing extension](FOLDER-WORKFLOW.md) to validate a CSV inbox, generate reports, track successful file fingerprints in SQLite and explain failures. It skips byte-identical resubmissions, preserves conflicting reports, recovers a missing reproducible report and rejects overlapping writers. Twelve additional tests exercise those behaviors and interruption recovery. No scheduler or email account is installed or connected.

The wrapper is `process_folder.py` and uses the same validated conversion core. The original three-order ASCII sample and supplied PDF are preserved; the current core also supports the documented accented text. A production integration needs the actual input and output samples, agreed calculations and delivery environment. The folder wrapper supports a single local output directory with SQLite locking and hard-link support, not a distributed worker service. No claims of client results or production processing are made.

For projects that begin on Upwork, please [message and hire through Upwork](https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be).
