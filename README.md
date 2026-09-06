# Pierce O'Donnell · Selected work

Small, inspectable examples of the work I deliver: careful data cleanup, useful spreadsheets, focused website repairs and clear analysis.

[Live portfolio](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site) · [36-second walkthrough](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/#walkthrough) · [Studio](https://odonnellos.online/studio) · [Hire on Upwork](https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be)

These are original portfolio demonstrations. All sample companies, orders and job records are fictional. The results below describe these supplied files, not a client's business performance.

## Find a relevant example

| Your project | Open the example | What you can inspect |
| --- | --- | --- |
| Clean an inconsistent order export | [Order CSV cleanup](csv-cleanup) | 12 input records → 6 accepted + 6 exceptions; exact decimal totals, preserved exceptions, source references and overwrite protection. |
| Organize an Excel job tracker | [Job tracker cleanup](job-tracker) | 18 records → 10 active + 4 archived + 4 for review; a five-sheet workbook, original records and a decision log. |
| Fix an HTML site that breaks after upload | [Local-to-hosted HTML repair](site-repair) | Three isolated reference fixes, before/after files and a case-sensitive local HTTP check at both root and subfolder paths. |
| Analyze an order dataset | [Fulfillment EDA](fulfillment-eda) | 243 fictional records → 233 accepted + 10 for review; an executed Pandas notebook, three charts and an explanation of missing data and an outlier. |

### Preview without installing anything

- [Open the job tracker report](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/job-tracker.html) or [download the Excel workbook](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/job-tracker.xlsx).
- [See the HTML repair evidence](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/site-repair.html).
- [Read the analysis report](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/fulfillment-eda.html) or [open the executed notebook](fulfillment-eda/fulfillment-eda.ipynb).
- [Try the interactive Orderly CSV demo](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/automation).

## Run the checks

Download or clone this repository, then run this command from its top folder with Python 3.10 or newer:

```text
python verify_samples.py
```

This runs the **19 standard-library tests** for CSV cleanup, the job tracker and HTML repair. It needs no packages or credentials. The HTML tests briefly start a loopback-only server and close it afterward. The supplied input files remain unchanged.

For all **24 tests**, use Python 3.12 in a separate virtual environment, install the recorded analysis dependencies, then include the EDA suite:

```text
python -m pip install -r fulfillment-eda/requirements.txt
python verify_samples.py --include-eda
```

See each example's README for its input schema, commands, business rules and limits. The EDA README also explains how to re-execute the notebook. The tracker script generates CSV/JSON output; the formatted workbook is a separate, manually editable snapshot.

## What a client handoff includes

An agreed scope, the working files, readable changes, instructions to run or update them, and checks tied to the requested behavior. I start with the real input or existing site and agree any uncertain rules before changing the data.

For projects that begin on Upwork, please [message and hire me through Upwork](https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be).

## Scope of this collection

This repository contains the source for the downloadable demonstrations in my portfolio. The complete O'Donnell OS product is separate; [its live demo](https://odonnellos.online/demo) is available to explore. No customer datasets, private product code or account credentials are included here.
