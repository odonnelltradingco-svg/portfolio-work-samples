# Verification record

## Automatic checks

The [public workflow](https://github.com/odonnelltradingco-svg/portfolio-work-samples/actions/workflows/verify-samples.yml) runs on each push to `main` and each pull request. Open a completed run for its exact commit, result and logs. Python 3.10 runs the 19 standard-library tests; Python 3.12 runs all 24 tests and re-executes the complete EDA notebook in a fresh kernel. Both jobs check that tracked sample files remain unchanged. The notebook's newly generated outputs stay in the temporary runner workspace.

This adds a Linux environment check to the local verification below. It does not test Excel's desktop interface or the hosted browser demos. No deployment credentials are used; third-party actions are pinned to exact commits and repository access is read-only.

## Recorded local verification

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
