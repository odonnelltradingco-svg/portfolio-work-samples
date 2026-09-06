'use client';
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The scrollable table region needs keyboard focus for horizontal scrolling. */

import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  FileCode2,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Upload,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DemoRibbon } from '@/components/demo-shared';
import { SiteLink } from '@/components/site-link';
import { ExportPreview } from '@/components/export-preview';
import {
  analyzeOrders,
  cleanedOrdersCsv,
  displayUsd,
  MAX_CSV_BYTES,
  ORDER_FIELDS,
  type OrderException,
} from '@/lib/order-cleanup';
import { SAMPLE_ORDER_CSV } from '@/lib/order-sample';

const PAGE_SIZE = 20;
const rules = [
  [
    'Safe normalization',
    'Column names are trimmed and lowercased. Outer spaces are removed from values, and status is lowercased. Valid prices are formatted to two decimal places.',
  ],
  [
    'No guessed repairs',
    'Missing customers, impossible dates, invalid amounts and unexpected statuses need review. They are excluded from the accepted rows, with original values preserved.',
  ],
  [
    'Duplicates stay visible',
    'Order IDs are case-sensitive. Every later occurrence is flagged, even if the first occurrence has another problem. No duplicate is silently merged or replaced.',
  ],
  [
    'Totals that reconcile',
    'Quantity × unit price is calculated in exact cents. Paid, pending and refunded order values are shown separately. Only accepted paid rows contribute to the paid total. This is an order review, not a net-cash ledger.',
  ],
];

function Pagination({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  if (!count) return null;
  return (
    <div className="orderly-pagination">
      <span>
        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, count)} of{' '}
        {count} records
      </span>
      <div>
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={(page + 1) * PAGE_SIZE >= count}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function OriginalRow({ row }: { row: OrderException }) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" className="orderly-row-button" />}
      >
        Original row <ArrowUpRight size={15} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="orderly-original">
        <DialogTitle>Source line {row.source_line}</DialogTitle>
        <DialogDescription>
          {row.reason}. The values below have not been changed.
        </DialogDescription>
        <ol className="orderly-raw-values">
          {row.raw_values.map((value, index) => (
            <li key={index}>
              <span>Column {index + 1}</span>
              <pre>{JSON.stringify(value)}</pre>
            </li>
          ))}
        </ol>
        {row.raw_values.length === 0 && <p>This record is an empty line.</p>}
        <p>
          Values are shown in their original column order. Quotes make blank
          values and spaces visible; escaped characters show line breaks and
          control characters.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default function Orderly() {
  const [input, setInput] = useState(SAMPLE_ORDER_CSV);
  const [sourceName, setSourceName] = useState('sample-orders.csv');
  const [result, setResult] = useState(() => analyzeOrders(SAMPLE_ORDER_CSV));
  const [reviewedInput, setReviewedInput] = useState(SAMPLE_ORDER_CSV);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [tab, setTab] = useState('review');
  const [acceptedPage, setAcceptedPage] = useState(0);
  const [exceptionPage, setExceptionPage] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const fileRead = useRef(0);
  const current = input === reviewedInput && !reading && !error;
  const summary = result.summary;

  function updateInput(value: string) {
    fileRead.current++;
    setReading(false);
    setInput(value);
    setError('');
    setSourceName('Pasted or edited CSV');
    setAnnouncement('Input changed. Run the review to update the results.');
  }
  function loadSample() {
    fileRead.current++;
    setReading(false);
    setInput(SAMPLE_ORDER_CSV);
    setSourceName('sample-orders.csv');
    setError('');
    setAnnouncement(
      'Fictional sample loaded. Run the review after making changes.',
    );
  }
  function review() {
    try {
      const next = analyzeOrders(input);
      setResult(next);
      setReviewedInput(input);
      setError('');
      setAcceptedPage(0);
      setExceptionPage(0);
      setTab(next.exceptions.length ? 'review' : 'accepted');
      setAnnouncement(
        `Review complete. ${next.summary.accepted_records} accepted, ${next.summary.rejected_records} need review. Paid total ${displayUsd(next.summary.collected_revenue_usd)}.`,
      );
      requestAnimationFrame(() => reviewHeading.current?.focus());
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to read this CSV. Check the format and try again.',
      );
      setAnnouncement('Review could not be completed. Check the input error.');
      inputRef.current?.focus();
    }
  }
  async function chooseFile(file?: File) {
    if (!file) return;
    const read = ++fileRead.current;
    setError('');
    setReading(true);
    setAnnouncement('Reading your file in this browser.');
    try {
      if (file.size > MAX_CSV_BYTES)
        throw new Error('Choose a CSV no larger than 2 MB.');
      const bytes = await file.arrayBuffer();
      if (read !== fileRead.current) return;
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        throw new Error(
          'This file is not UTF-8 text. Export it as CSV UTF-8 and try again.',
        );
      }
      setInput(text);
      setSourceName(file.name);
      setAnnouncement('File loaded locally. Run the review to inspect it.');
    } catch (failure) {
      if (read === fileRead.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'The file could not be read. Try pasting its CSV text.',
        );
    } finally {
      if (read === fileRead.current) setReading(false);
    }
  }

  return (
    <div className="orderly">
      <a className="orderly-skip" href="#orderly-input">
        Skip to the CSV input
      </a>
      <DemoRibbon label="Fictional order data · Local processing" />
      <header className="orderly-nav">
        <SiteLink className="orderly-logo" href="/data-cleanup">
          <span>
            <CheckCheck size={23} aria-hidden="true" />
          </span>
          orderly<span className="orderly-edition">CSV WORKBENCH</span>
        </SiteLink>
        <a href="/downloads/csv-cleanup-sample.zip" download>
          Python source <FileCode2 size={17} aria-hidden="true" />
        </a>
      </header>
      <main>
        <section className="orderly-hero" aria-labelledby="orderly-title">
          <div>
            <p className="orderly-eyebrow">
              FROM MESSY EXPORT TO CLEAR NEXT STEP
            </p>
            <h1 id="orderly-title">
              Good data starts
              <br />
              with <em>a closer look.</em>
            </h1>
            <p>
              Clean the safe details. Flag what needs a decision. Keep a clear
              path back to every original row.
            </p>
            <a href="#orderly-workbench" className="orderly-text-link">
              Try the working sample <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <aside className="orderly-flow" aria-label="How this example works">
            <div>
              <span>01</span>
              <FileSpreadsheet size={21} aria-hidden="true" />
              <strong>Bring the export</strong>
              <small>Paste text or choose a CSV</small>
            </div>
            <ArrowDown size={16} aria-hidden="true" />
            <div>
              <span>02</span>
              <TriangleAlert size={21} aria-hidden="true" />
              <strong>Review the exceptions</strong>
              <small>See what needs your attention</small>
            </div>
            <ArrowDown size={16} aria-hidden="true" />
            <div>
              <span>03</span>
              <CheckCheck size={21} aria-hidden="true" />
              <strong>Keep the useful records</strong>
              <small>Clean rows and separate totals</small>
            </div>
          </aside>
        </section>
        <div className="orderly-local">
          <ShieldCheck size={19} aria-hidden="true" />
          <p>
            CSV contents are processed in this tab and are not uploaded or saved
            by this tool. The included sample is fictional. Refreshing clears
            your edits.
          </p>
        </div>
        <section
          id="orderly-workbench"
          className="orderly-workbench"
          aria-label="CSV cleanup workbench"
        >
          <div className="orderly-input-panel">
            <div className="orderly-panel-heading">
              <div>
                <p className="orderly-eyebrow">01 / YOUR SOURCE</p>
                <h2>Start with the original.</h2>
              </div>
              <FileSpreadsheet size={24} aria-hidden="true" />
            </div>
            <p className="orderly-input-help">
              The sample contains six usable orders and six records with issues.
              Edit it to see how the review responds.
            </p>
            <div className="orderly-input-actions">
              <label className="orderly-file">
                <Upload size={17} aria-hidden="true" />
                Choose CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Choose CSV file"
                  onChange={(event) => {
                    void chooseFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              <Button variant="outline" onClick={loadSample}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset sample
              </Button>
            </div>
            <label htmlFor="orderly-input" className="orderly-input-label">
              CSV contents <span>{sourceName}</span>
            </label>
            <Textarea
              id="orderly-input"
              ref={inputRef}
              className="orderly-source"
              value={input}
              onChange={(event) => updateInput(event.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={
                error ? 'orderly-error orderly-format' : 'orderly-format'
              }
            />
            <p id="orderly-format" className="orderly-format">
              CSV UTF-8 · Up to 2 MB / 10,000 records · Required columns in any
              order: <code>{ORDER_FIELDS.join(', ')}</code>
            </p>
            {error && (
              <p id="orderly-error" className="orderly-error" role="alert">
                <TriangleAlert size={18} aria-hidden="true" />
                {error}
              </p>
            )}
            <Button
              className="orderly-primary"
              onClick={review}
              disabled={reading}
            >
              {reading ? 'Reading file…' : 'Run the review'}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <p className="orderly-small">
              Your source stays intact. Review the exceptions before using the
              accepted records.
            </p>
          </div>
          <div className="orderly-results" aria-busy={reading}>
            <div className="orderly-panel-heading">
              <div>
                <p className="orderly-eyebrow">02 / THE REVIEW</p>
                <h2 ref={reviewHeading} tabIndex={-1}>
                  Every row accounted for.
                </h2>
              </div>
              <span className={'orderly-state ' + (current ? 'ready' : '')}>
                {current ? 'Review ready' : 'Run to update'}
              </span>
            </div>
            {!current ? (
              <div className="orderly-stale">
                <FileSpreadsheet size={35} aria-hidden="true" />
                <h3>
                  {error
                    ? 'Fix the input, then try again.'
                    : 'Your source has changed.'}
                </h3>
                <p>
                  Run the review to calculate fresh results. Previous totals and
                  exports are hidden until they match your input.
                </p>
              </div>
            ) : (
              <>
                <div className="orderly-metrics">
                  <div>
                    <span>Accepted records</span>
                    <strong>
                      {summary.accepted_records.toLocaleString('en-US')}
                      <Check size={19} aria-hidden="true" />
                    </strong>
                    <small>
                      of {summary.input_records.toLocaleString('en-US')} input
                      records
                    </small>
                  </div>
                  <div className="orderly-attention">
                    <span>Need review</span>
                    <strong>
                      {summary.rejected_records.toLocaleString('en-US')}
                      <TriangleAlert size={19} aria-hidden="true" />
                    </strong>
                    <small>Original values preserved</small>
                  </div>
                  <div>
                    <span>Paid order total</span>
                    <strong>{displayUsd(summary.collected_revenue_usd)}</strong>
                    <small>
                      {summary.status_counts.paid} accepted paid records · USD
                    </small>
                  </div>
                </div>
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(String(value))}
                  className="orderly-tabs"
                >
                  <TabsList variant="line" aria-label="Review results">
                    <TabsTrigger value="review">
                      Needs review <span>{summary.rejected_records}</span>
                    </TabsTrigger>
                    <TabsTrigger value="accepted">
                      Accepted <span>{summary.accepted_records}</span>
                    </TabsTrigger>
                    <TabsTrigger value="totals">Totals & exports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="review">
                    <div className="orderly-tab-intro">
                      <h3>A decision before a repair.</h3>
                      <p>
                        These rows are excluded. Correct the source only when
                        you know the right value, then run the review again.
                      </p>
                    </div>
                    {result.exceptions.length ? (
                      <>
                        <div className="orderly-exceptions">
                          {result.exceptions
                            .slice(
                              exceptionPage * PAGE_SIZE,
                              (exceptionPage + 1) * PAGE_SIZE,
                            )
                            .map((row) => (
                              <article key={row.source_line}>
                                <div>
                                  <span className="orderly-line">
                                    LINE {row.source_line}
                                  </span>
                                  <p>{row.reason}</p>
                                </div>
                                <OriginalRow row={row} />
                              </article>
                            ))}
                        </div>
                        <Pagination
                          page={exceptionPage}
                          count={result.exceptions.length}
                          onChange={setExceptionPage}
                        />
                      </>
                    ) : (
                      <div className="orderly-empty">
                        <CheckCheck size={28} aria-hidden="true" />
                        <h3>No exceptions found.</h3>
                        <p>
                          All input records passed the stated checks. Open
                          Accepted to inspect them.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="accepted">
                    <div className="orderly-tab-intro">
                      <h3>Ready for a closer look.</h3>
                      <p>
                        {
                          summary.accepted_records_with_whitespace_or_case_cleanup
                        }{' '}
                        accepted{' '}
                        {summary.accepted_records_with_whitespace_or_case_cleanup ===
                        1
                          ? 'row had'
                          : 'rows had'}{' '}
                        whitespace or status-case cleanup. Valid prices are
                        formatted to two decimal places.
                      </p>
                    </div>
                    {result.cleaned_rows.length ? (
                      <>
                        <section
                          className="orderly-table-scroll"
                          aria-label="Accepted order records"
                          tabIndex={0}
                        >
                          <table>
                            <caption className="sr-only">
                              Accepted orders with original source lines and
                              exact USD totals
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">Source / order</th>
                                <th scope="col">Customer / date</th>
                                <th scope="col">Qty × USD</th>
                                <th scope="col">Total USD</th>
                                <th scope="col">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.cleaned_rows
                                .slice(
                                  acceptedPage * PAGE_SIZE,
                                  (acceptedPage + 1) * PAGE_SIZE,
                                )
                                .map((row) => (
                                  <tr key={row.source_line}>
                                    <td>
                                      <strong>{row.order_id}</strong>
                                      <small>Line {row.source_line}</small>
                                    </td>
                                    <td>
                                      {row.customer}
                                      <small>{row.date}</small>
                                    </td>
                                    <td>
                                      {row.quantity} × {row.unit_price}
                                    </td>
                                    <td>{displayUsd(row.total_usd)}</td>
                                    <td>
                                      <span
                                        className={
                                          'orderly-status ' + row.status
                                        }
                                      >
                                        {row.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </section>
                        <Pagination
                          page={acceptedPage}
                          count={result.cleaned_rows.length}
                          onChange={setAcceptedPage}
                        />
                      </>
                    ) : (
                      <div className="orderly-empty">
                        <TriangleAlert size={28} aria-hidden="true" />
                        <h3>No accepted orders yet.</h3>
                        <p>
                          {summary.input_records
                            ? 'Inspect the flagged rows, correct the source and run the review again.'
                            : 'Your file has a header but no order records. Add rows below the header, or reset the sample.'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="totals">
                    <div className="orderly-tab-intro">
                      <h3>Keep the numbers separate.</h3>
                      <p>
                        These are order values by status. Pending and refunded
                        records do not contribute to the paid total.
                      </p>
                    </div>
                    <dl className="orderly-total-list">
                      {(['paid', 'pending', 'refunded'] as const).map(
                        (status) => (
                          <div key={status}>
                            <dt>
                              <span className={'orderly-status ' + status}>
                                {status}
                              </span>
                              <small>
                                {summary.status_counts[status]} accepted records
                              </small>
                            </dt>
                            <dd>
                              {displayUsd(
                                summary.order_value_by_status_usd[status],
                              )}
                              <small>USD</small>
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                    <p className="orderly-reconciliation">
                      <Check size={17} aria-hidden="true" />
                      {summary.input_records} input = {summary.accepted_records}{' '}
                      accepted + {summary.rejected_records} for review
                    </p>
                    <div className="orderly-exports">
                      <h4>Inspect and save the outputs.</h4>
                      <p>
                        Each preview contains the complete output from this
                        review, including rows beyond the current page.
                      </p>
                      <div>
                        <ExportPreview
                          label="Cleaned CSV"
                          filename="cleaned-orders.csv"
                          type="text/csv"
                          text={cleanedOrdersCsv(result.cleaned_rows)}
                          title="Accepted orders"
                          description="Normalized accepted rows, exact totals and original source-line references. No flagged records are included."
                        />
                        <ExportPreview
                          label="Exceptions JSON"
                          filename="exceptions.json"
                          type="application/json"
                          text={
                            JSON.stringify(result.exceptions, null, 2) + '\n'
                          }
                          title="Original values, with reasons"
                          description="Every flagged row is retained in JSON with its original values and source line. Nothing has been guessed or silently repaired."
                        />
                        <ExportPreview
                          label="Summary JSON"
                          filename="summary.json"
                          type="application/json"
                          text={
                            JSON.stringify(
                              {
                                ...summary,
                                notes: summary.notes.map((note) =>
                                  note.startsWith('Fictional portfolio data')
                                    ? 'Original portfolio tool; this is not an accounting system.'
                                    : note,
                                ),
                              },
                              null,
                              2,
                            ) + '\n'
                          }
                          title="Reconciled summary"
                          description="Accepted and rejected counts, normalization counts and separate order values by status."
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </section>
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </output>
        <section
          className="orderly-rules"
          aria-labelledby="orderly-rules-title"
        >
          <div>
            <p className="orderly-eyebrow">THE RULES ARE PART OF THE WORK</p>
            <h2 id="orderly-rules-title">
              A useful cleanup
              <br />
              leaves a trail.
            </h2>
            <p>
              Predictable checks, visible exceptions and a source you can return
              to.
            </p>
          </div>
          <Accordion>
            {rules.map(([title, description]) => (
              <AccordionItem key={title} value={title}>
                <AccordionTrigger>{title}</AccordionTrigger>
                <AccordionContent>{description}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
        <section className="orderly-source-pack">
          <FileCode2 size={31} aria-hidden="true" />
          <div>
            <p className="orderly-eyebrow">
              FROM BROWSER DEMO TO REPEATABLE SCRIPT
            </p>
            <h2>Run the Python sample yourself.</h2>
            <p>
              The companion package implements the same order checks with
              standard-library Python. Includes source, eight tests, the
              fictional input and expected outputs. Python 3.10+; no extra
              packages.
            </p>
            <a
              className="orderly-case-link"
              href="/downloads/orderly-case-study.pdf"
              download
            >
              Read the one-page case study (PDF){' '}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <a href="/downloads/csv-cleanup-sample.zip" download>
            Get the source package <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </section>
        <section
          className="orderly-source-pack"
          aria-labelledby="orderly-eda-title"
        >
          <FileSpreadsheet size={31} aria-hidden="true" />
          <div>
            <p className="orderly-eyebrow">
              THE NEXT STEP / EXPLORATORY ANALYSIS
            </p>
            <h2 id="orderly-eda-title">
              Turn clean records into explained findings.
            </h2>
            <p>
              A separate Pandas notebook reviews 243 fictional orders, preserves
              exceptions and explains three descriptive figures. Includes the
              executed notebook, reusable source and expected results.
            </p>
            <SiteLink
              className="orderly-case-link"
              href="/downloads/fulfillment-eda.html"
            >
              Read the visual analysis report{' '}
              <ArrowUpRight size={16} aria-hidden="true" />
            </SiteLink>
          </div>
          <a href="/downloads/fulfillment-eda.zip" download>
            Get the notebook + source{' '}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="orderly-footer">
        <span>Original portfolio example by Pierce O’Donnell</span>
        <a href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be">
          Discuss your workflow on Upwork{' '}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
