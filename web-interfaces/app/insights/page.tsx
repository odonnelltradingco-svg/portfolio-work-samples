'use client';

import { useRef, useState } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  BarChart3,
  Search,
  ArrowUpRight,
  Wallet,
  Package,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { DemoRibbon, Choice } from '@/components/demo-shared';
import { ExportPreview } from '@/components/export-preview';
import {
  orders,
  summarizeOrders,
  money,
  cleanMoney,
  csvForOrders,
  filterOrders,
  revenueBuckets,
  type DemoOrder,
} from '@/lib/demo-model';

export default function Insights() {
  const [period, setPeriod] = useState('month');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const orderTriggerRef = useRef<HTMLButtonElement>(null);
  const rows = filterOrders(orders, {
    period,
    channel,
    status,
    search,
  }).toSorted((a, b) =>
    sort === 'amount'
      ? b.amount - a.amount
      : sort === 'oldest'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
  );
  const totals = summarizeOrders(rows);
  const bars = revenueBuckets(rows);
  const ceiling = Math.max(...bars.map((bar) => bar.value), 1);
  const activeFilters =
    period !== 'month' ||
    channel !== 'all' ||
    status !== 'all' ||
    search.trim() !== '';
  const metrics = [
    {
      label: 'Collected revenue',
      value: money(totals.revenue),
      Icon: Wallet,
      note: 'Paid orders only',
    },
    {
      label: 'Gross profit',
      value: money(totals.profit),
      Icon: TrendingUp,
      note: 'Revenue minus product cost',
    },
    {
      label: 'Paid orders',
      value: String(totals.count),
      Icon: Package,
      note: 'Excludes pending & refunded',
    },
    {
      label: 'Average paid order',
      value: cleanMoney(totals.average),
      Icon: BarChart3,
      note: 'Based on current filters',
    },
  ];
  function resetFilters() {
    setPeriod('month');
    setChannel('all');
    setStatus('all');
    setSearch('');
    setSort('newest');
  }

  return (
    <div className="insights">
      <DemoRibbon label="Fictional orders · August 2026" />
      <header className="insights-nav">
        <Link className="fieldnote-logo" href="/insights">
          <BarChart3 aria-hidden="true" />
          fieldnote<span>Business overview</span>
        </Link>
        <span className="sample-badge">
          <span />
          Sample workspace
        </span>
      </header>
      <main className="insights-main">
        <div className="insights-title">
          <div>
            <p className="eyebrow">YOUR BUSINESS, AT A GLANCE</p>
            <h1>Order performance</h1>
            <p className="muted">
              Follow the numbers, right down to the order.
            </p>
          </div>
          <div className="insights-actions">
            <Choice
              id="period"
              label="Reporting period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: 'August 2026' },
                { value: 'week', label: 'Aug 25–31, 2026' },
              ]}
            />
            <ExportPreview
              text={csvForOrders(rows)}
              filename="fieldnote-filtered-orders.csv"
              type="text/csv"
              title="Export this view"
              description={`${rows.length} matching sample orders, in the same order as the table. Paid, pending and refunded rows retain their status in the file.`}
              label="Export CSV"
              className="report-export"
              disabled={!rows.length}
            />
          </div>
        </div>
        <div className="dashboard-filters">
          <fieldset
            className="insights-channel-tabs"
            aria-label="Sales channel"
          >
            {[
              { value: 'all', label: 'All channels' },
              { value: 'Website', label: 'Website' },
              { value: 'Wholesale', label: 'Wholesale' },
            ].map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                aria-pressed={channel === option.value}
                onClick={() => setChannel(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </fieldset>
          <div className="filter-summary">
            <span>{rows.length} matching orders · sample data</span>
            {activeFilters && (
              <Button variant="ghost" onClick={resetFilters}>
                <SlidersHorizontal size={15} aria-hidden="true" />
                Reset filters
              </Button>
            )}
          </div>
        </div>
        <output className="sr-only" aria-live="polite">
          {rows.length} matching orders. {totals.count} paid. Collected revenue{' '}
          {money(totals.revenue)}.
        </output>
        <section
          className="metric-grid"
          aria-label="Filtered performance totals"
        >
          {metrics.map(({ label, value, Icon, note }) => (
            <article className="metric" key={label}>
              <div>
                <span>{label}</span>
                <Icon size={19} aria-hidden="true" />
              </div>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </section>
        <section
          className="chart-grid"
          aria-label="Revenue and pending payment breakdown"
        >
          <div className="chart-card">
            <div className="chart-heading">
              <div>
                <h2>Collected revenue</h2>
                <p>Weekly periods across August · current filters</p>
              </div>
              <span>USD</span>
            </div>
            {totals.count ? (
              <figure
                className="bar-chart"
                aria-label={bars
                  .map((bar) => `${bar.label}: ${money(bar.value)}`)
                  .join('; ')}
              >
                {bars.map((bar) => (
                  <div className="chart-column" key={bar.start}>
                    <strong>{money(bar.value)}</strong>
                    <div className="bar-track">
                      <div
                        style={{ height: `${(bar.value / ceiling) * 100}%` }}
                      />
                    </div>
                    <span>{bar.label}</span>
                  </div>
                ))}
              </figure>
            ) : (
              <div className="chart-empty">
                <BarChart3 size={30} aria-hidden="true" />
                <strong>No paid orders in this view</strong>
                <p>
                  Pending and refunded orders stay in the table, without adding
                  to collected revenue.
                </p>
              </div>
            )}
          </div>
          <div className="channel-card">
            <p className="eyebrow">PAYMENTS TO FOLLOW UP</p>
            <strong>{money(totals.pending)}</strong>
            <p>Pending order value in the current filters.</p>
            <div className="channel-breakdown">
              {['Website', 'Wholesale'].map((value) => {
                const revenue = summarizeOrders(
                  rows.filter((row) => row.channel === value),
                ).revenue;
                return (
                  <div key={value}>
                    <div>
                      <span>{value}</span>
                      <b>{money(revenue)}</b>
                    </div>
                    <div className="small-track">
                      <span
                        style={{
                          width: totals.revenue
                            ? `${(revenue / totals.revenue) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="metric-note">
              Channel bars show paid revenue. Gross profit excludes operating
              expenses, tax and fees.
            </p>
          </div>
        </section>
        <section className="orders-card" aria-labelledby="orders-title">
          <div className="orders-heading">
            <div>
              <h2 id="orders-title">The orders behind the numbers</h2>
              <p className="muted">Open an order to see its contribution.</p>
            </div>
            <div className="order-controls">
              <div className="order-search-field">
                <label className="field-label" htmlFor="order-search">
                  Customer or order
                </label>
                <div className="search-control">
                  <Search size={17} aria-hidden="true" />
                  <Input
                    id="order-search"
                    placeholder="Search customer or order"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
              <Choice
                id="status"
                label="Order status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All statuses' },
                  ...['Paid', 'Pending', 'Refunded'].map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
              />
              <Choice
                id="sort"
                label="Sort orders"
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'amount', label: 'Highest amount' },
                ]}
              />
            </div>
          </div>
          <Table className="orders-table">
            <caption className="sr-only">
              Filtered sample orders. Amounts in US dollars. Open an order
              number for details.
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Order / date</TableHead>
                <TableHead scope="col">Customer</TableHead>
                <TableHead scope="col">Channel</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="number-cell">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="order-link"
                        aria-label={`View order ${row.id}`}
                        onClick={(event) => {
                          orderTriggerRef.current = event.currentTarget;
                          setSelectedOrder(row);
                        }}
                      >
                        {row.id}
                      </Button>
                      <span className="order-date">{row.date}</span>
                    </TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell>
                      <span
                        className={'order-status ' + row.status.toLowerCase()}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="number-cell">
                      {money(row.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="empty-orders">
                      <h3>No matching orders</h3>
                      <p>Try another customer, period or status.</p>
                      <Button variant="outline" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="table-footer">
            <span>
              Showing {rows.length} of {orders.length} fictional orders
            </span>
            <span>Export uses these exact rows and this sort order</span>
          </div>
        </section>
        <footer className="dashboard-footer">
          <span>Original dashboard demonstration · No live business data</span>
          <a href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be">
            Discuss your dashboard <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </footer>
      </main>
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="order-dialog" finalFocus={orderTriggerRef}>
          {selectedOrder && (
            <>
              <div className="order-detail-heading">
                <DialogTitle>{selectedOrder.id}</DialogTitle>
                <span>{selectedOrder.status}</span>
              </div>
              <DialogDescription>
                Follow this sample order into the dashboard totals.
              </DialogDescription>
              <dl className="order-detail-grid">
                <div>
                  <dt>Customer</dt>
                  <dd>{selectedOrder.customer}</dd>
                </div>
                <div>
                  <dt>Order date</dt>
                  <dd>{selectedOrder.date}</dd>
                </div>
                <div>
                  <dt>Channel</dt>
                  <dd>{selectedOrder.channel}</dd>
                </div>
                <div>
                  <dt>Order amount</dt>
                  <dd>{money(selectedOrder.amount)}</dd>
                </div>
              </dl>
              <dl className="order-financials">
                <div>
                  <dt>Collected revenue contribution</dt>
                  <dd>
                    {money(
                      selectedOrder.status === 'Paid'
                        ? selectedOrder.amount
                        : 0,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Recorded product cost</dt>
                  <dd>{money(selectedOrder.cost)}</dd>
                </div>
                <div className="order-profit">
                  <dt>Gross profit contribution</dt>
                  <dd>
                    {money(
                      selectedOrder.status === 'Paid'
                        ? selectedOrder.amount - selectedOrder.cost
                        : 0,
                    )}
                  </dd>
                </div>
              </dl>
              <p className="order-detail-note">
                {selectedOrder.status === 'Paid'
                  ? 'This paid order contributes its amount to revenue and its amount minus product cost to gross profit. Operating expenses, tax and fees are excluded.'
                  : selectedOrder.status === 'Pending'
                    ? 'This order is still pending. Its amount contributes to pending value, while collected revenue and gross profit contributions remain zero.'
                    : 'This order is marked refunded. The demo excludes it from collected revenue, paid-order count and gross profit.'}
              </p>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Back to the dashboard
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
