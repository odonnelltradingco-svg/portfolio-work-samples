export const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
export function cleanEstimate(
  beds: number,
  baths: number,
  frequency: string,
  deep: boolean,
) {
  if (
    !Number.isInteger(beds) ||
    beds < 1 ||
    beds > 5 ||
    !Number.isInteger(baths) ||
    baths < 1 ||
    baths > 4
  )
    throw new Error('Choose a supported home size');
  if (!['once', 'fortnightly', 'weekly'].includes(frequency))
    throw new Error('Choose a supported frequency');
  const standard = 70 + beds * 25 + baths * 20;
  const extra = deep ? 65 : 0;
  const base = standard + extra;
  const discountPercent =
    frequency === 'weekly' ? 15 : frequency === 'fortnightly' ? 10 : 0;
  // Calculate in cents so the displayed discount and total always reconcile.
  const baseCents = base * 100;
  const discountCents = Math.round((baseCents * discountPercent) / 100);
  return {
    standard,
    extra,
    base,
    discountPercent,
    discount: discountCents / 100,
    total: (baseCents - discountCents) / 100,
  };
}
export const cleanMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
export function projectEstimate(
  kind: string,
  pages: number,
  features: string[],
) {
  const bases: Record<string, number> = { website: 550, dashboard: 950 };
  if (
    !Object.hasOwn(bases, kind) ||
    !Number.isInteger(pages) ||
    pages < 1 ||
    pages > 8
  )
    throw new Error('Choose a valid project scope');
  const extras: Record<string, number> = {
    forms: 120,
    reporting: 240,
    content: 180,
  };
  const selected = [...new Set(features)];
  if (selected.some((key) => !Object.hasOwn(extras, key)))
    throw new Error('Choose supported project features');
  const featureCost = selected.reduce((sum, key) => sum + extras[key], 0);
  const pageCost = Math.max(0, pages - 1) * 95;
  const basePrice = bases[kind];
  const low = basePrice + pageCost + featureCost;
  return {
    basePrice,
    pageCost,
    featureCost,
    low,
    high: Math.round(low * 1.25),
    days:
      Math.ceil(pages * 1.5) + (kind === 'dashboard' ? 5 : 3) + selected.length,
  };
}
export function validateProjectGoal(name: string, brief: string) {
  return {
    name:
      name.trim().length < 2
        ? 'Add a project name with at least 2 characters.'
        : name.trim().length > 80
          ? 'Keep the project name within 80 characters.'
          : '',
    brief:
      brief.trim().length < 15
        ? 'Describe the goal in at least 15 characters.'
        : brief.trim().length > 600
          ? 'Keep the goal within 600 characters.'
          : '',
  };
}
export type DemoOrder = {
  id: string;
  date: string;
  customer: string;
  channel: 'Website' | 'Wholesale';
  status: 'Paid' | 'Pending' | 'Refunded';
  amount: number;
  cost: number;
};
export const orders: DemoOrder[] = [
  {
    id: 'FN-1081',
    date: '2026-08-31',
    customer: 'Juniper Supply',
    channel: 'Wholesale',
    status: 'Paid',
    amount: 1240,
    cost: 660,
  },
  {
    id: 'FN-1080',
    date: '2026-08-30',
    customer: 'Mara Ellis',
    channel: 'Website',
    status: 'Paid',
    amount: 285,
    cost: 134,
  },
  {
    id: 'FN-1079',
    date: '2026-08-28',
    customer: 'Rowan & Co.',
    channel: 'Wholesale',
    status: 'Pending',
    amount: 860,
    cost: 410,
  },
  {
    id: 'FN-1078',
    date: '2026-08-26',
    customer: 'Theo Lane',
    channel: 'Website',
    status: 'Paid',
    amount: 190,
    cost: 85,
  },
  {
    id: 'FN-1077',
    date: '2026-08-24',
    customer: 'Aster Goods',
    channel: 'Wholesale',
    status: 'Paid',
    amount: 1560,
    cost: 805,
  },
  {
    id: 'FN-1076',
    date: '2026-08-21',
    customer: 'Nora Bell',
    channel: 'Website',
    status: 'Refunded',
    amount: 125,
    cost: 54,
  },
  {
    id: 'FN-1075',
    date: '2026-08-18',
    customer: 'Cedar Market',
    channel: 'Wholesale',
    status: 'Paid',
    amount: 940,
    cost: 425,
  },
  {
    id: 'FN-1074',
    date: '2026-08-15',
    customer: 'Owen Finch',
    channel: 'Website',
    status: 'Paid',
    amount: 340,
    cost: 151,
  },
  {
    id: 'FN-1073',
    date: '2026-08-11',
    customer: 'Lila Moss',
    channel: 'Website',
    status: 'Paid',
    amount: 230,
    cost: 100,
  },
  {
    id: 'FN-1072',
    date: '2026-08-08',
    customer: 'Kite Trading',
    channel: 'Wholesale',
    status: 'Paid',
    amount: 1080,
    cost: 502,
  },
  {
    id: 'FN-1071',
    date: '2026-08-05',
    customer: 'Eden Reed',
    channel: 'Website',
    status: 'Pending',
    amount: 175,
    cost: 83,
  },
  {
    id: 'FN-1070',
    date: '2026-08-02',
    customer: 'Westhaven',
    channel: 'Wholesale',
    status: 'Paid',
    amount: 730,
    cost: 318,
  },
];
export function summarizeOrders(rows: DemoOrder[]) {
  const paid = rows.filter((r) => r.status === 'Paid');
  const revenue = paid.reduce((s, r) => s + r.amount, 0);
  const profit = paid.reduce((s, r) => s + r.amount - r.cost, 0);
  return {
    revenue,
    profit,
    count: paid.length,
    average: paid.length ? revenue / paid.length : 0,
    pending: rows
      .filter((r) => r.status === 'Pending')
      .reduce((s, r) => s + r.amount, 0),
  };
}
export type OrderFilters = {
  period: string;
  channel: string;
  status: string;
  search: string;
};
export function filterOrders(rows: DemoOrder[], filters: OrderFilters) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      row.date >= '2026-08-01' &&
      row.date <= '2026-08-31' &&
      (filters.period === 'month' || row.date >= '2026-08-25') &&
      (filters.channel === 'all' || row.channel === filters.channel) &&
      (filters.status === 'all' || row.status === filters.status) &&
      `${row.id} ${row.customer}`.toLowerCase().includes(query),
  );
}
export function revenueBuckets(rows: DemoOrder[]) {
  const buckets = [
    { label: 'Aug 1–7', start: 1, end: 7 },
    { label: 'Aug 8–14', start: 8, end: 14 },
    { label: 'Aug 15–21', start: 15, end: 21 },
    { label: 'Aug 22–28', start: 22, end: 28 },
    { label: 'Aug 29–31', start: 29, end: 31 },
  ];
  return buckets.map((bucket) => ({
    ...bucket,
    value: rows
      .filter(
        (row) =>
          row.status === 'Paid' &&
          Number(row.date.slice(-2)) >= bucket.start &&
          Number(row.date.slice(-2)) <= bucket.end,
      )
      .reduce((total, row) => total + row.amount, 0),
  }));
}
export function csvForOrders(rows: DemoOrder[]) {
  const cell = (v: string | number) =>
    '"' + String(v).replaceAll('"', '""') + '"';
  return [
    'Order,Date,Customer,Channel,Status,Amount USD,Cost USD',
    ...rows.map((r) =>
      [r.id, r.date, r.customer, r.channel, r.status, r.amount, r.cost]
        .map(cell)
        .join(','),
    ),
  ].join('\r\n');
}
