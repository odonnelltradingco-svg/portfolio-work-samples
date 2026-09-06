# Job tracker cleanup

Original portfolio demonstration by Pierce O'Donnell. All 18 job records, company names, dates and example.com URLs are fictional. This is not a client project or a record of real applications.

## Included

- `Job Tracker Cleanup.xlsx`: five-sheet cleaned sample. Overview, Active, Archive, Review and Original.
- `sample-tracker.csv`: untouched fictional input.
- `clean_tracker.py`: standard-library CSV cleaner for the documented input columns.
- `test_tracker.py`: six focused regression tests.
- `expected/`: the three output CSV files and a complete decision log.

## Result

18 source records = 10 active + 4 archived + 4 review records. All records keep a one-based source-record identifier. The archive retains two exact normalized duplicates, one explicitly closed record and one explicitly expired record. Review retains an unknown status, a missing identity and two conflicting records with the same identity. An old but open posting remains active.

## Rules

Outside whitespace is trimmed; known status aliases map to Saved, Applied, Interviewing, Offer, Closed or Expired. HTTP(S) URL schemes and hosts are lowercased. URL path case, query strings and fragments are retained.

Records sharing a job ID or exact normalized URL form an identity group. Later copies are archived only when every normalized field matches. Conflicting groups stay in Review. Unknown statuses, missing job identity/title/client, invalid URLs and non-ISO or impossible dates stay in Review. No fuzzy matching, network lookup, inference of interview status or age-based deletion occurs.

## Run the CSV cleaner

Requires Python 3.10 or newer. No extra packages, API key or network access.

```text
python -m unittest test_tracker.py
python clean_tracker.py sample-tracker.csv --output results
```

`results/active.csv`, `archive.csv`, `review.csv` and `decisions.json` should match the included expected files. The source is read only. Use a separate output folder. The CSV schema must match the supplied sample exactly; change the mapping deliberately for another schema. Formula-like text in generated CSV cells receives a leading apostrophe to discourage spreadsheet formula interpretation. The JSON log retains the original and normalized values. It is still prudent to review imported text in the target spreadsheet application.

## Using the workbook

Active jobs have status dropdowns and filters. Update the amber status, next-action and due-date cells. The amber reference date on Overview controls the count of scheduled follow-ups due on or before that date. Undated follow-ups are excluded. Status colors and due-date highlighting respond to edits.

Summary formulas, status validation and due-date formatting cover rows 7–206. Extend these ranges for a larger tracker. Record identifiers must stay numeric and unique across the cleaned sheets for the count reconciliation to remain meaningful. Keep Original unchanged. Move records manually between the three cleaned sheets when a decision or status changes; keep their source record IDs. The workbook is a snapshot, not an automatic import or routing system. The included Python script regenerates CSV/JSON outputs, not the formatted workbook.

## Verification and limits

Six Python tests check source preservation, record conservation, duplicate/conflict handling, date/status validation, URL identity, no age-based deletion and formula-like CSV text. Workbook checks reconcile 18 records, verify status counts and three due follow-ups, and exercise a date change and an extra-record reconciliation difference. All five sheet layouts were rendered and inspected. This does not claim testing in every Excel version or a live client environment. The Original sheet retains date text as received; cleaned sheets use actual Excel date values.
