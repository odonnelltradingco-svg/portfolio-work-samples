# Repeatable folder-to-PDF processing

An extension to the original three-order conversion sample. It scans a local inbox once, validates each complete CSV, writes one summary PDF per valid CSV and records successful processing in SQLite. Run the same command again to see already-processed files skipped. All example records remain fictional.

This is runnable source for inspecting a daily-processing workflow. It does not install a scheduler, connect an email account or operate a client system.

## Try a first run and a repeat

Install the dependencies from this folder's `requirements.txt` using Python 3.12. Create a separate input folder and copy `sample-orders.csv` into it. Keep output separate from input.

```text
python process_folder.py --input-dir demo-inbox --output-dir results
```

The first run creates one report, with three validated orders and a total of GBP 32.45. The console prints a readable JSON result containing the filename, status, output filename, order count and total. Run the exact same command again: the result says `skipped` and the original PDF is untouched.

```text
python -m unittest -v test_report_orders.py test_process_folder.py
```

There are ten conversion tests and twelve additional folder-workflow tests. These cover both success and failure paths; they do not stand in for validation against a client's real format or delivery environment.

## What happens to each file

| Situation | Result |
| --- | --- |
| New, valid CSV | A complete PDF is published and its content fingerprint is recorded. |
| Same bytes submitted again, even under a new filename | The existing report is verified and skipped. |
| Different content under the same filename | A new report is created; the earlier report stays intact. |
| Invalid CSV alongside valid files | That CSV receives a readable error; valid files still finish. |
| Recorded report was deleted | The runner recreates it only if the current generator reproduces the recorded PDF hash. |
| Existing report was edited or conflicts with expected output | The runner reports an error and preserves the existing file. |
| Process stops after PDF publication but before history commit | A later run recognizes a byte-identical report and rebuilds its history record. |
| Two runs overlap on the same output folder | The second run exits promptly; it does not start a second set of reports. |

Deduplication uses the SHA-256 of the complete input bytes. Whitespace, line endings and other byte changes count as a new submission. This is file-level deduplication; it does **not** detect the same order appearing in two different exports. Duplicate order IDs within a single CSV are rejected by the conversion core. Cross-file business rules need to be agreed separately.

## Files, history and errors

- Inputs are read without moving, renaming or modifying them. CSVs are not recursively discovered; the runner considers `.csv` files directly in the input directory, regardless of extension case.
- Producers should upload using a temporary extension such as `.part`, then rename to `.csv` on the same local disk after writing finishes. A size/time change during a read is rejected, but this is not a substitute for that completion protocol.
- Report names use the complete input fingerprint, for example `report-<64-character-sha256>.pdf`. A new report is written fully to a temporary file, flushed and atomically linked into place without replacing any existing destination.
- `batch-history.sqlite3` belongs to the output folder. It stores input and PDF hashes, generated filenames, order counts, totals and completion timestamps. Keep it with the corresponding reports. It contains operational data; keep it private when processing real orders.
- The JSON result goes to standard output. Errors include filenames and the failed validation rule, but do not echo input rows. Redirect output to a new log filename if you want to keep each run's report.
- Exit code **0** means all eligible files were created, skipped or recovered; **2** means one or more files failed, or the batch could not start. A partial failure can leave successful reports, which are skipped on the next run.
- A normal failure cleans temporary files. A hard process termination can leave `.pending-*.pdf` files in the output folder. These are ignored by the runner; review/remove them only when no run is active.

## Scheduling and deployment boundary

The command is designed for a scheduler to invoke once per interval. On a chosen host, configure its task scheduler with the virtual environment's full Python path, this script's absolute path and absolute input/output folder paths. Use a dedicated local output folder, capture stdout/stderr, and treat exit code 2 as requiring review. No recurring task has been installed by this sample.

This version uses a **local disk** with SQLite locking and hard-link support, such as NTFS or ext4. It is not verified for network shares, cloud-sync folders, FAT/exFAT, multiple machines or parallel distributed workers. Separate invocations against the same local output folder are serialized by a database write lock. Atomic publication protects against process interruption; no power-loss or hardware-failure guarantee is made.

Limits: 100 CSV files per invocation, 5 MB and 10,000 orders per input, and a 50 MB output-PDF limit. Conversion rules, ASCII text scope and exact decimal rounding remain as documented in the [main README](README.md). The supplied PDF remains the original conversion-core report; its note about not tracking files describes that core script, not this separate wrapper.

Before adapting this for a paid project, agree the actual CSV schema, calculations, one report per order versus per file, duplicate-order policy, output design, run frequency, destination and failure-notification route. Mailbox ingestion, subscriptions, notifications and host setup are separate integrations. No accounts, credentials, paid services or live customer files are used here.
