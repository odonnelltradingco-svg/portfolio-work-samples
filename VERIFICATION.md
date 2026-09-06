# Verification record

Verified September 6, 2026 with Python 3.12.14 on Windows. This records the supplied demonstration, not testing of a client system.

| Suite | Tests | Result |
| --- | ---: | --- |
| CSV cleanup | 8 | Passed |
| Job tracker | 6 | Passed |
| HTML repair | 5 | Passed |
| Fulfillment EDA | 5 | Passed |
| **Total** | **24** | **Passed** |

Run `python verify_samples.py --include-eda` from the repository root after installing the EDA requirements to reproduce the test run. Run without that flag for the 19 standard-library tests.

The suites check the supplied partitions, original values, exact money totals, duplicate handling and review rules. HTML checks also exercise a temporary case-sensitive HTTP fixture at a domain root and a subfolder. The job tracker workbook's earlier verification included all five rendered sheet layouts, saved formulas, status validation, count reconciliation and an edited-date scenario. These Python suites exercise its CSV cleanup logic; they do not open Microsoft Excel or prove compatibility with every Excel version.

The original EDA notebook includes executed cell outputs and figures. See its README to re-execute it in a fresh kernel. The suite checks the analysis functions; running the suite alone does not rerender every chart or rerun the notebook.

The source files in the four sample folders were copied from the portfolio's published downloadable samples. Repeated notebook-run folders, Python caches and local environments are excluded from the repository.
