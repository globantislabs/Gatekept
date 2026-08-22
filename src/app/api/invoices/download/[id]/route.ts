import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/download/[id] — Returns a printable HTML representation
// of the invoice. This is opened in a new tab by the admin; the page has a
// "Print" button and CSS @media print rules so the browser's "Print to PDF"
// produces a clean invoice.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          order_number: true,
          status: true,
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  if (!invoice) {
    return new Response('<h1>Invoice not found</h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Parse line items
  let lineItems: Array<{
    name: string
    quantity: number
    unit_price: number
    total_price: number
    pack_type?: string | null
  }> = []
  try {
    lineItems = JSON.parse(invoice.items || '[]')
  } catch {
    lineItems = []
  }

  const issuedDate = new Date(invoice.issued_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Status color helper
  const statusColor: Record<string, string> = {
    ISSUED: '#c4880e',
    PAID: '#48805b',
    CANCELLED: '#c44530',
    OVERDUE: '#c44530',
  }
  const statusBg: Record<string, string> = {
    ISSUED: '#fdf5e6',
    PAID: '#e8f0eb',
    CANCELLED: '#fceeed',
    OVERDUE: '#fceeed',
  }
  const sColor = statusColor[invoice.status] || '#666'
  const sBg = statusBg[invoice.status] || '#f4f3f0'

  const inr = (n: number) =>
    `₹${(Number(n) || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  // Build line items rows
  const itemRows = lineItems
    .map(
      (it, i) => `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td class="col-sno">${i + 1}</td>
          <td class="col-name">
            ${escapeHtml(it.name || '—')}
            ${it.pack_type ? `<span class="pack-tag">${escapeHtml(it.pack_type.replace(/_/g, ' '))}</span>` : ''}
          </td>
          <td class="col-qty">${it.quantity || 1}</td>
          <td class="col-price">${inr(it.unit_price)}</td>
          <td class="col-total">${inr(it.total_price)}</td>
        </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1f1e1c; background: #f4f3f0;
  }
  .page {
    max-width: 800px; margin: 0 auto; padding: 32px;
    background: #ffffff; min-height: 100vh;
  }
  .topbar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1f1e1c;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand .logo {
    width: 48px; height: 48px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .brand .logo img { width: 100%; height: 100%; object-fit: contain; }
  .brand .name { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .brand .sub { font-size: 11px; color: #6b6560; }
  .actions { display: flex; gap: 8px; }
  .btn {
    padding: 8px 14px; border-radius: 6px; border: 1px solid #e3dfd8;
    background: #fff; color: #1f1e1c; font-size: 13px; font-weight: 500;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none;
  }
  .btn:hover { background: #f4f3f0; }
  .btn-primary { background: #48805b; color: #fff; border-color: #48805b; }
  .btn-primary:hover { background: #3d6b4d; }
  .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
  .header .left h1 { font-size: 24px; margin: 0 0 4px; letter-spacing: -0.5px; }
  .header .left .invoice-no { font-size: 13px; color: #6b6560; }
  .header .right { text-align: right; }
  .header .right .status {
    display: inline-block; padding: 4px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 600; color: ${sColor}; background: ${sBg};
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .header .right .issued { font-size: 12px; color: #6b6560; }
  .header .right .order-ref { font-size: 11px; color: #99948d; margin-top: 2px; }
  .panels { display: flex; gap: 16px; margin-bottom: 24px; }
  .panel { flex: 1; padding: 14px 16px; background: #faf9f6; border: 1px solid #eeebe5; border-radius: 8px; }
  .panel h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #99948d; font-weight: 600; }
  .panel p { margin: 2px 0; font-size: 13px; line-height: 1.5; }
  .panel .muted { color: #6b6560; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  thead th {
    text-align: left; padding: 10px 12px; background: #1f1e1c; color: #fff;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
  }
  thead th.right { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #eeebe5; }
  tbody tr.odd { background: #faf9f6; }
  .col-sno { width: 36px; color: #99948d; }
  .col-qty { width: 70px; text-align: center; }
  .col-price, .col-total { width: 110px; text-align: right; }
  thead .col-price, thead .col-total { text-align: right; }
  thead .col-qty { text-align: center; }
  .pack-tag {
    display: inline-block; margin-left: 6px; padding: 1px 6px;
    font-size: 10px; font-weight: 600; color: #2e91b2; background: #e6f2f7;
    border-radius: 4px; text-transform: uppercase; letter-spacing: 0.4px;
  }
  .totals { margin-left: auto; width: 280px; margin-bottom: 24px; }
  .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .totals .row.muted { color: #6b6560; }
  .totals .row.total {
    border-top: 2px solid #1f1e1c; margin-top: 4px; padding-top: 12px;
    font-size: 18px; font-weight: 700;
  }
  .totals .row.total .val { color: #48805b; }
  .payment {
    padding: 12px 16px; background: #f4f5e8; border: 1px solid #d6d8b6;
    border-radius: 8px; font-size: 12px; color: #5e6226; margin-bottom: 16px;
  }
  .payment strong { color: #1f1e1c; }
  .notes {
    padding: 12px 16px; background: #faf9f6; border: 1px solid #eeebe5;
    border-radius: 8px; font-size: 12px; color: #6b6560;
  }
  .notes .label { font-weight: 600; color: #1f1e1c; margin-bottom: 4px; display: block; }
  .footer {
    margin-top: 32px; padding-top: 16px; border-top: 1px solid #eeebe5;
    font-size: 11px; color: #99948d; text-align: center; line-height: 1.6;
  }
  .footer .company { font-weight: 600; color: #6b6560; }
  @media print {
    body { background: #fff; }
    .page { max-width: none; padding: 0; }
    .actions { display: none !important; }
    .topbar { border-bottom: 1px solid #1f1e1c; }
    @page { margin: 16mm; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div class="brand">
        <div class="logo">NJ</div>
        <div class="logo"><img src="https://notjustwatr.com/images/notjust-logo-clean.png" alt="NOTJUST" /></div>
        <div>
          <div class="name">NOTJUST</div>
          <div class="sub">NOTJUST Watr · Wellness, simplified.</div>
        </div>
      </div>
      <div class="actions">
        <a class="btn" href="javascript:window.print()">🖨 Print / Save as PDF</a>
        <a class="btn" href="/">← Back to Site</a>
      </div>
    </div>

    <div class="header">
      <div class="left">
        <h1>Invoice</h1>
        <div class="invoice-no">Invoice No: <strong>${escapeHtml(invoice.invoice_number)}</strong></div>
      </div>
      <div class="right">
        <div class="status">${escapeHtml(invoice.status)}</div>
        <div class="issued">Issued: ${issuedDate}</div>
        <div class="order-ref">Order Ref: ${escapeHtml(invoice.order?.order_number || '—')}</div>
      </div>
    </div>

    <div class="panels">
      <div class="panel">
        <h3>Bill To</h3>
        <p><strong>${escapeHtml(invoice.customer_name)}</strong></p>
        ${invoice.customer_phone ? `<p class="muted">📞 ${escapeHtml(invoice.customer_phone)}</p>` : ''}
        ${invoice.customer_email ? `<p class="muted">✉ ${escapeHtml(invoice.customer_email)}</p>` : ''}
        ${
          invoice.billing_address
            ? `<p class="muted">${escapeHtml(invoice.billing_address)}${
                invoice.billing_city ? `, ${escapeHtml(invoice.billing_city)}` : ''
              }${
                invoice.billing_state ? `, ${escapeHtml(invoice.billing_state)}` : ''
              }${
                invoice.billing_pincode ? ` - ${escapeHtml(invoice.billing_pincode)}` : ''
              }</p>`
            : ''
        }
      </div>
      <div class="panel">
        <h3>Payment</h3>
        <p><strong>Method:</strong> ${escapeHtml(invoice.payment_method || '—')}</p>
        <p><strong>Status:</strong> ${escapeHtml(invoice.payment_status || '—')}</p>
        <p class="muted">Customer ID: ${escapeHtml(invoice.user_id)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-sno">#</th>
          <th>Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Unit Price</th>
          <th class="col-total">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="text-align:center;color:#99948d;padding:24px">No line items</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="row muted"><span>Subtotal</span><span>${inr(invoice.subtotal)}</span></div>
      <div class="row muted"><span>Tax (GST)</span><span>${inr(invoice.tax_amount)}</span></div>
      <div class="row muted"><span>Discount</span><span>− ${inr(invoice.discount_amount)}</span></div>
      <div class="row total"><span>Total Due</span><span class="val">${inr(invoice.total_amount)}</span></div>
    </div>

    ${
      invoice.payment_method || invoice.payment_status
        ? `<div class="payment"><strong>Payment:</strong> ${escapeHtml(invoice.payment_method || '—')} · <strong>Status:</strong> ${escapeHtml(invoice.payment_status || '—')}</div>`
        : ''
    }

    ${
      invoice.notes
        ? `<div class="notes"><span class="label">Notes</span>${escapeHtml(invoice.notes)}</div>`
        : ''
    }

    <div class="footer">
      <div class="company">NOTJUST · NOTJUST Watr</div>
      <div>This is a computer-generated invoice and does not require a physical signature.</div>
      <div>Thank you for your business! · notjustwatr.com</div>
    </div>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

// Minimal HTML escaping to prevent XSS in the printable invoice.
function escapeHtml(s: string | null | undefined): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
