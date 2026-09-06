# Pierce O'Donnell · Selected work

[![Verify work samples](https://github.com/odonnelltradingco-svg/portfolio-work-samples/actions/workflows/verify-samples.yml/badge.svg)](https://github.com/odonnelltradingco-svg/portfolio-work-samples/actions/workflows/verify-samples.yml)

Inspectable examples of the work I deliver: interactive React websites, careful data cleanup, useful spreadsheets, focused website repairs and clear analysis.

[Live portfolio](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site) · [36-second walkthrough](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/#walkthrough) · [Studio](https://odonnellos.online/studio) · [Hire on Upwork](https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be)

These are original portfolio demonstrations. All sample companies, orders and job records are fictional. The results below describe these supplied files, not a client's business performance.

## Find a relevant example

| Your project | Open the example | What you can inspect |
| --- | --- | --- |
| Build a responsive React interface | [Four interactive web demos](web-interfaces) | Cleaning estimate, sales dashboard, guided brief and CSV review; complete local app, typed source and 22 logic tests. |
| Clean an inconsistent order export | [Order CSV cleanup](csv-cleanup) | 12 input records → 6 accepted + 6 exceptions; exact decimal totals, preserved exceptions, source references and overwrite protection. |
| Organize an Excel job tracker | [Job tracker cleanup](job-tracker) | 18 records → 10 active + 4 archived + 4 for review; a five-sheet workbook, original records and a decision log. |
| Fix an HTML site that breaks after upload | [Local-to-hosted HTML repair](site-repair) | Three isolated reference fixes, before/after files and a case-sensitive local HTTP check at both root and subfolder paths. |
| Analyze an order dataset | [Fulfillment EDA](fulfillment-eda) | 243 fictional records → 233 accepted + 10 for review; an executed Pandas notebook, three charts and an explanation of missing data and an outlier. |

### Preview without installing anything

- [Open the job tracker report](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/job-tracker.html) or [download the Excel workbook](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/job-tracker.xlsx).
- [See the HTML repair evidence](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/site-repair.html).
- [Read the analysis report](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/downloads/fulfillment-eda.html) or [open the executed notebook](fulfillment-eda/fulfillment-eda.ipynb).
- [Try the interactive Orderly CSV demo](https://pierce-portfolio-demos.odonnelltradingco.chatgpt.site/data-cleanup).

## Run the checks

[Open the automatic verification runs](https://github.com/odonnelltradingco-svg/portfolio-work-samples/actions/workflows/verify-samples.yml) to inspect the exact commit, environment and test logs. The Python jobs check 19 standard-library tests on Python 3.10, all 24 Python tests on Python 3.12, and a full notebook execution in a fresh kernel on Ubuntu. The React job runs 22 logic tests, TypeScript checks and a production build. Each job checks that supplied files remain unchanged. The badge shows the current workflow status, not a claim about a client system.

Download or clone this repository, then run this command from its top folder with Python 3.10 or newer:

```text
python verify_samples.py
```

This runs the **19 standard-library tests** for CSV cleanup, the job tracker and HTML repair. It needs no packages or credentials. The HTML tests briefly start a loopback-only server and close it afterward. The supplied input files remain unchanged.

For all **24 Python tests**, use Python 3.12 in a separate virtual environment, install the recorded analysis dependencies, then include the EDA suite:

```text
python -m pip install -r fulfillment-eda/requirements.txt
python verify_samples.py --include-eda
```

For the **22 React interface-logic tests** and the complete local web app, follow [the web-interface setup instructions](web-interfaces). The Python runner above does not run those checks.

See each example's README for its input schema, commands, business rules and limits. The EDA README also explains how to re-execute the notebook. The tracker script generates CSV/JSON output; the formatted workbook is a separate, manually editable snapshot.

## What a client handoff includes

An agreed scope, the working files, readable changes, instructions to run or update them, and checks tied to the requested behavior. I start with the real input or existing site and agree any uncertain rules before changing the data.

For projects that begin on Upwork, please [message and hire me through Upwork](https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be).

## Scope of this collection

This repository contains the source for the downloadable demonstrations and a runnable snapshot of the four interactive portfolio demos. The complete O'Donnell OS product is separate; [its live demo](https://odonnellos.online/demo) is available to explore. No customer datasets, private product code or account credentials are included here.
