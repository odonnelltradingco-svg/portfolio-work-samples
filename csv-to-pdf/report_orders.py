"""Validate a fictional order CSV and write a paginated GBP demonstration report."""
from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO, StringIO
from pathlib import Path
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

FIELDS = ('order_id', 'item', 'quantity', 'unit_price')
MAX_ROWS = 10000
MAX_BYTES = 5_000_000
CENT = Decimal('0.01')


def supports_report_text(value: str) -> bool:
    """Accept printable text representable by the built-in WinAnsi PDF fonts."""
    if not value.isprintable():
        return False
    try:
        value.encode('cp1252', errors='strict')
    except UnicodeEncodeError:
        return False
    return True


class InputError(ValueError):
    """Expected input validation error, without echoing raw records."""


@dataclass(frozen=True)
class Order:
    order_id: str
    item: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


def clean_rows(text: str) -> list[Order]:
    """Fail the complete file on an invalid row; never silently discard orders."""
    reader = csv.reader(StringIO(text.lstrip('\ufeff'), newline=''), strict=True)
    try:
        headers = next(reader, [])
        headers = [value.strip() for value in headers]
        if len(headers) != len(FIELDS) or set(headers) != set(FIELDS):
            raise InputError('Expected exactly: order_id, item, quantity, unit_price.')
        orders, seen = [], set()
        for record in reader:
            line = reader.line_num
            if len(orders) >= MAX_ROWS:
                raise InputError(f'Limit is {MAX_ROWS} orders per report.')
            if len(record) != len(FIELDS):
                raise InputError(f'Line {line}: expected four fields; blank records are invalid.')
            row = dict(zip(headers, (v.strip() for v in record)))
            for field, limit in [('order_id', 64), ('item', 160)]:
                value = row[field]
                if not value or len(value) > limit or not supports_report_text(value):
                    raise InputError(f'Line {line}: {field} must be 1-{limit} printable characters supported by the report font (WinAnsi).')
            if row['order_id'] in seen:
                raise InputError(f'Line {line}: duplicate order ID after whitespace cleanup.')
            if not re.fullmatch(r'[0-9]{1,7}', row['quantity']):
                raise InputError(f'Line {line}: quantity must be a positive whole number.')
            quantity = int(row['quantity'])
            if not 1 <= quantity <= 1_000_000:
                raise InputError(f'Line {line}: quantity must be between 1 and 1000000.')
            if not re.fullmatch(r'[0-9]{1,10}(?:\.[0-9]{1,6})?', row['unit_price']):
                raise InputError(f'Line {line}: unit_price must be an unsigned decimal with at most six decimal places.')
            price = Decimal(row['unit_price'])
            if price > Decimal('1000000000'):
                raise InputError(f'Line {line}: unit_price exceeds this demonstration limit.')
            total = (quantity * price).quantize(CENT, rounding=ROUND_HALF_UP)
            orders.append(Order(row['order_id'], row['item'], quantity, price, total))
            seen.add(row['order_id'])
    except csv.Error as exc:
        raise InputError(f'Line {reader.line_num}: malformed CSV quoting.') from exc
    if not orders:
        raise InputError('No orders found.')
    return orders


def order_total(orders: list[Order]) -> Decimal:
    return sum((order.line_total for order in orders), Decimal('0.00'))


def render_report(orders: list[Order]) -> bytes:
    """Portable fonts, repeated headings, wrapped cells and deterministic PDF metadata."""
    ink, teal = colors.HexColor('#142E2B'), colors.HexColor('#15766B')
    muted, pale = colors.HexColor('#546764'), colors.HexColor('#EEF5F2')
    out = BytesIO()
    doc = SimpleDocTemplate(out, pagesize=(612, 792), rightMargin=42, leftMargin=42,
                           topMargin=46, bottomMargin=48, invariant=1,
                           title='Order report | Fictional CSV-to-PDF demonstration',
                           author="Pierce O'Donnell")
    label = ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=teal)
    title = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=30, leading=36, textColor=ink)
    body = ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=15, textColor=muted)
    cell = ParagraphStyle('cell', fontName='Helvetica', fontSize=9, leading=13, textColor=ink, splitLongWords=True)
    number = ParagraphStyle('number', parent=cell, alignment=2)
    head = ParagraphStyle('head', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.white)
    story = [Paragraph('PIERCE O\'DONNELL / AUTOMATION SAMPLE', label), Spacer(1, 13),
             Paragraph('CSV in. Clear PDF out.', title), Spacer(1, 10),
             Paragraph('Fictional orders. Validated input. Traceable calculations.', body), Spacer(1, 24),
             Paragraph('DEMONSTRATION ONLY - ALL ORDERS ARE FICTIONAL', label), Spacer(1, 20),
             Paragraph(f'Daily order summary / {len(orders):,} validated orders / Currency: GBP', body), Spacer(1, 13)]
    data = [[Paragraph(value, head) for value in ('ORDER', 'ITEM', 'QTY', 'UNIT / GBP', 'TOTAL / GBP')]]
    for order in orders:
        unit = format(order.unit_price, 'f')
        if '.' not in unit:
            unit += '.00'
        elif len(unit.split('.')[1]) == 1:
            unit += '0'
        data.append([Paragraph(escape(order.order_id), cell), Paragraph(escape(order.item), cell),
                     Paragraph(str(order.quantity), number), Paragraph(unit, number),
                     Paragraph(f'{order.line_total:.2f}', number)])
    table = Table(data, colWidths=[96, 158, 46, 108, 120], repeatRows=1, hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ink),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [pale, colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 11), ('BOTTOMPADDING', (0, 0), (-1, -1), 11),
        ('LINEBELOW', (0, -1), (-1, -1), .5, colors.HexColor('#D8E4DF')),
    ]))
    story += [table, Spacer(1, 23), Paragraph('TOTAL ORDER VALUE', label), Spacer(1, 5),
              Paragraph(f'GBP {order_total(orders):,.2f}', title), Spacer(1, 22),
              Paragraph('How the totals are calculated', label), Spacer(1, 7),
              Paragraph('Each quantity is multiplied by its original unit price using decimal arithmetic. '
                        'Each line is rounded to two decimals using ROUND_HALF_UP; the report total is the sum of those rounded lines. '
                        'Unit prices retain their supplied precision. Tax, shipping, discounts and currency conversion are not included.', body),
              Spacer(1, 14), Paragraph('This is an original conversion demonstration. It does not connect to email, '
                                         'schedule jobs or track files across runs. See the included README for the input rules and run instructions.', body)]

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFillColor(teal)
        canvas.rect(0, 783, 612, 9, fill=1, stroke=0)
        canvas.setFillColor(muted)
        canvas.setFont('Helvetica', 8)
        canvas.drawString(42, 27, 'Original portfolio demonstration / Contact Pierce through Upwork')
        canvas.drawRightString(570, 27, f'Page {document.page}')
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return out.getvalue()


def convert(input_path: Path, output_path: Path) -> tuple[int, Decimal]:
    if input_path.resolve() == output_path.resolve():
        raise InputError('Input and output paths must differ.')
    if output_path.exists():
        raise FileExistsError('Output already exists; choose a new output filename.')
    with input_path.open('rb') as source:
        raw = source.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise InputError('Input exceeds the 5 MB demonstration limit.')
    try:
        orders = clean_rows(raw.decode('utf-8-sig'))
    except UnicodeDecodeError as exc:
        raise InputError('Input must be UTF-8 encoded.') from exc
    content = render_report(orders)
    # Exclusive creation also protects against a new file appearing during rendering.
    with output_path.open('xb') as target:
        target.write(content)
    return len(orders), order_total(orders)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        count, total = convert(args.input, args.output)
    except (InputError, OSError) as exc:
        print(f'Not generated: {exc}', file=sys.stderr)
        return 2
    print(f'Created {args.output.name}: {count} validated orders; GBP {total:.2f}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
