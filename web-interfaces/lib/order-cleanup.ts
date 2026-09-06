export const ORDER_FIELDS = [
  'order_id',
  'date',
  'customer',
  'quantity',
  'unit_price',
  'status',
] as const;
export const MAX_CSV_BYTES = 2_000_000;
export const MAX_CSV_ROWS = 10_000;
type OrderStatus = 'paid' | 'pending' | 'refunded';
export type CleanOrder = {
  order_id: string;
  date: string;
  customer: string;
  quantity: number;
  unit_price: string;
  status: OrderStatus;
  total_usd: string;
  source_line: number;
};
export type OrderException = {
  source_line: number;
  reason: string;
  raw_values: string[];
};
export type CleanupResult = {
  cleaned_rows: CleanOrder[];
  exceptions: OrderException[];
  summary: {
    currency: string;
    input_records: number;
    accepted_records: number;
    rejected_records: number;
    accepted_records_with_whitespace_or_case_cleanup: number;
    status_counts: Record<OrderStatus, number>;
    order_value_by_status_usd: Record<OrderStatus, string>;
    collected_revenue_usd: string;
    notes: string[];
  };
};

// Quoted commas, escaped quotes and embedded line breaks retain their source lines.
export function parseOrderCsv(
  input: string,
): { values: string[]; line: number }[] {
  if (new TextEncoder().encode(input).length > MAX_CSV_BYTES)
    throw new Error('Input exceeds the 2 MB sample limit');
  const text = input.replace(/^\uFEFF/, '');
  if (!text.length) throw new Error('Input has no header');
  const rows: { values: string[]; line: number }[] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closedQuote = false;
  let line = 1,
    startLine = 1,
    hasRecord = false;
  const finishRow = () => {
    rows.push({ values: hasRecord ? [...row, cell] : [], line: startLine });
    if (rows.length > MAX_CSV_ROWS + 1)
      throw new Error('Input exceeds the 10,000-record sample limit');
    row = [];
    cell = '';
    closedQuote = false;
    hasRecord = false;
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += char;
        if (char === '\n' || (char === '\r' && text[index + 1] !== '\n'))
          line++;
      }
      continue;
    }
    if (char === ',' || char === '\n' || char === '\r') {
      if (char === ',') {
        row.push(cell);
        cell = '';
        closedQuote = false;
        hasRecord = true;
      } else {
        finishRow();
        if (char === '\r' && text[index + 1] === '\n') index++;
        line++;
        startLine = line;
      }
    } else if (char === '"' && !cell.length && !closedQuote) {
      quoted = true;
      hasRecord = true;
    } else {
      if (char === '"' || closedQuote)
        throw new Error(
          `Malformed CSV at line ${line}. Put quotes around a whole field and double any quote inside it.`,
        );
      cell += char;
      hasRecord = true;
    }
  }
  if (quoted)
    throw new Error(
      `Unclosed quoted field starting in the record at line ${startLine}.`,
    );
  if (hasRecord) finishRow();
  return rows;
}

function realDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
  );
}

function cents(value: string) {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'));
}
function decimal(value: bigint) {
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, '0')}`;
}
export function displayUsd(value: string) {
  const [whole, fraction] = value.split('.');
  return (
    '$' + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + (fraction || '00')
  );
}

export function analyzeOrders(input: string): CleanupResult {
  const [first, ...rows] = parseOrderCsv(input);
  if (!first) throw new Error('Input has no header');
  const header = first.values.map((value) => value.trim().toLowerCase());
  if (new Set(header).size !== header.length)
    throw new Error('Duplicate column names after normalization');
  if (
    header.length !== ORDER_FIELDS.length ||
    ORDER_FIELDS.some((field) => !header.includes(field))
  ) {
    throw new Error(
      'Expected exactly these columns: ' + ORDER_FIELDS.join(', '),
    );
  }
  const cleaned_rows: CleanOrder[] = [],
    exceptions: OrderException[] = [];
  const seen = new Set<string>();
  let normalizations = 0;
  for (const { values, line } of rows) {
    const reject = (reason: string) =>
      exceptions.push({ source_line: line, reason, raw_values: values });
    if (!values.length || values.every((value) => !value.trim())) {
      reject('Empty record');
      continue;
    }
    if (values.length !== header.length) {
      reject('Wrong number of columns');
      continue;
    }
    const raw = Object.fromEntries(
      header.map((key, index) => [key, values[index]]),
    );
    const record = Object.fromEntries(
      header.map((key) => [key, raw[key].trim()]),
    );
    record.status = record.status.toLowerCase();
    const normalized = header.some((key) => record[key] !== raw[key]);
    const reasons: string[] = [];
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(record.order_id))
      reasons.push(
        'Order ID must be 1–64 letters, digits, hyphens or underscores',
      );
    else if (seen.has(record.order_id))
      reasons.push('Duplicate order ID; first occurrence retained for review');
    seen.add(record.order_id);
    if (!record.customer || Array.from(record.customer).length > 160)
      reasons.push('Customer must contain 1–160 characters');
    else if (
      /^[=+\-@]/.test(record.customer) ||
      Array.from(record.customer).some(
        (character) => character.charCodeAt(0) < 32,
      )
    )
      reasons.push(
        'Customer contains spreadsheet formula or control characters',
      );
    if (!realDate(record.date))
      reasons.push('Date must be a real calendar date in YYYY-MM-DD format');
    if (!/^[1-9]\d{0,5}$/.test(record.quantity))
      reasons.push('Quantity must be a whole number from 1 to 999999');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(record.unit_price))
      reasons.push(
        'Unit price must be nonnegative USD with at most two decimal places',
      );
    if (!['paid', 'pending', 'refunded'].includes(record.status))
      reasons.push('Status must be paid, pending or refunded');
    if (reasons.length) {
      reject(reasons.join('; '));
      continue;
    }
    const unit = cents(record.unit_price);
    cleaned_rows.push({
      order_id: record.order_id,
      date: record.date,
      customer: record.customer,
      quantity: Number(record.quantity),
      unit_price: decimal(unit),
      status: record.status as OrderStatus,
      total_usd: decimal(unit * BigInt(record.quantity)),
      source_line: line,
    });
    if (normalized) normalizations++;
  }
  const status_counts = { paid: 0, pending: 0, refunded: 0 };
  const totals = { paid: BigInt(0), pending: BigInt(0), refunded: BigInt(0) };
  for (const row of cleaned_rows) {
    status_counts[row.status]++;
    totals[row.status] += cents(row.total_usd);
  }
  const order_value_by_status_usd = {
    paid: decimal(totals.paid),
    pending: decimal(totals.pending),
    refunded: decimal(totals.refunded),
  };
  return {
    cleaned_rows,
    exceptions,
    summary: {
      currency: 'USD',
      input_records: rows.length,
      accepted_records: cleaned_rows.length,
      rejected_records: exceptions.length,
      accepted_records_with_whitespace_or_case_cleanup: normalizations,
      status_counts,
      order_value_by_status_usd,
      collected_revenue_usd: order_value_by_status_usd.paid,
      notes: [
        'Fictional portfolio data; this is not an accounting system.',
        'Only accepted paid rows contribute to collected revenue.',
        'Duplicate IDs are flagged even if the first occurrence is invalid.',
        'Original values remain in the exceptions JSON; no values are imputed.',
      ],
    },
  };
}

export function cleanedOrdersCsv(rows: CleanOrder[]) {
  const fields = [...ORDER_FIELDS, 'total_usd', 'source_line'] as const;
  const escape = (value: string | number) =>
    /[",\r\n]/.test(String(value))
      ? '"' + String(value).replaceAll('"', '""') + '"'
      : String(value);
  return (
    [
      fields.join(','),
      ...rows.map((row) => fields.map((field) => escape(row[field])).join(',')),
    ].join('\r\n') + '\r\n'
  );
}
