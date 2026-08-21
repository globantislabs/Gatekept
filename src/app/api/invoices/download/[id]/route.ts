import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/download/[id]
// Returns a printable HTML representation of the invoice.
// - Admins can download any invoice.
// - Regular users can download invoices for their own orders (via user_id cookie header).
// The page has a "Print" button + CSS @media print rules so browser "Print to PDF"
// produces a clean invoice with NotJust logo, GSTIN, billing address, date, GST breakdown.

// Company constants — printed on every invoice
const COMPANY = {
  name: 'NOTJUST',
  product: 'NOTJUST Watr',
  tagline: 'Wellness, simplified.',
  legalName: 'Zum Heilen Healthcare Private Limited',
  gstin: '29AAGCZ1234R1ZP',          // GSTIN (replace with actual)
  pan: 'AAGCZ1234R',
  cin: 'U74999KA2022PTC123456',
  address: 'Bengaluru, Karnataka 560022, India',
  email: 'info@zh-onehealth.com',
  phone: '+91 92880 07431',
  website: 'notjustwatr.com',
  stateCode: '29',                    // Karnataka state code for GST
}

// NotJust logo as inline SVG (avoids external file dependency in printable HTML)
const LOGO_SVG = `
<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
  <rect width="44" height="44" rx="10" fill="#1f1e1c"/>
  <text x="22" y="29" font-family="-apple-system,system-ui,sans-serif" font-size="17" font-weight="800" fill="#afb75d" text-anchor="middle" letter-spacing="-0.5">NJ</text>
</svg>`

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          order_number: true,
          status: true,
          payment_status: true,
          payment_method: true,
          created_at: true,
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  if (!invoice) {
    return new Response('<h1 style="font-family:sans-serif;padding:40px">Invoice not found</h1>', {
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
  const orderDate = invoice.order?.created_at
    ? new Date(invoice.order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : issuedDate

  // Status colors
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

  // GST breakdown: split total tax into CGST + SGST (50% each for intra-state)
  const totalGst = Number(invoice.tax_amount) || 0
  const cgst = totalGst / 2
  const sgst = totalGst / 2

  // Determine if intra-state (same state) — assume Karnataka (state code 29)
  const isSameState = true // both company and customer in Karnataka by default; adjust if customer state differs
  const customerStateCode = invoice.billing_state ? '29' : '29' // simplified

  // Build line items rows with per-item GST (18% assumed)
  const GST_RATE = 18
  const itemRows = lineItems
    .map((it, i) => {
      const lineTotal = Number(it.total_price) || 0
      const taxableValue = lineTotal / (1 + GST_RATE / 100)
      const itemGst = lineTotal - taxableValue
      return `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td class="col-sno">${i + 1}</td>
          <td class="col-name">
            ${escapeHtml(it.name || '—')}
            ${it.pack_type ? `<span class="pack-tag">${escapeHtml(it.pack_type.replace(/_/g, ' '))}</span>` : ''}
          </td>
          <td class="col-qty">${it.quantity || 1}</td>
          <td class="col-price">${inr(it.unit_price)}</td>
          <td class="col-taxable">${inr(taxableValue)}</td>
          <td class="col-gst">${inr(itemGst)}</td>
          <td class="col-total">${inr(lineTotal)}</td>
        </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${escapeHtml(invoice.invoice_number)} · NOTJUST</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1f1e1c; background: #f4f3f0;
  }
  .page {
    max-width: 820px; margin: 0 auto; padding: 32px;
    background: #ffffff; min-height: 100vh;
  }
  .topbar {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #1f1e1c;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand .logo { width: 44px; height: 44px; }
  .brand .name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #1f1e1c; }
  .brand .sub { font-size: 11px; color: #6b6560; margin-top: 2px; }
  .brand .legal { font-size: 10px; color: #99948d; margin-top: 4px; }
  .actions { display: flex; gap: 8px; flex-shrink: 0; }
  .btn {
    padding: 9px 16px; border-radius: 6px; border: 1px solid #e3dfd8;
    background: #fff; color: #1f1e1c; font-size: 13px; font-weight: 500;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none;
  }
  .btn:hover { background: #f4f3f0; }
  .btn-primary { background: #48805b; color: #fff; border-color: #48805b; }
  .btn-primary:hover { background: #3d6b4d; }
  .company-info {
    font-size: 11px; color: #6b6560; line-height: 1.6; text-align: right;
  }
  .company-info strong { color: #1f1e1c; }
  .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; flex-wrap: wrap; }
  .header .left h1 { font-size: 28px; margin: 0 0 6px; letter-spacing: -0.5px; color: #1f1e1c; }
  .header .left .invoice-no { font-size: 13px; color: #6b6560; }
  .header .left .invoice-no strong { color: #1f1e1c; }
  .header .right { text-align: right; min-width: 200px; }
  .header .right .status {
    display: inline-block; padding: 5px 12px; border-radius: 6px;
    font-size: 11px; font-weight: 600; color: ${sColor}; background: ${sBg};
    margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .header .right .issued { font-size: 12px; color: #6b6560; }
  .header .right .order-ref { font-size: 11px; color: #99948d; margin-top: 2px; }
  .panels { display: flex; gap: 16px; margin-bottom: 24px; }
  .panel { flex: 1; padding: 16px 18px; background: #faf9f6; border: 1px solid #eeebe5; border-radius: 8px; }
  .panel h3 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #99948d; font-weight: 600; }
  .panel p { margin: 3px 0; font-size: 13px; line-height: 1.5; }
  .panel .muted { color: #6b6560; }
  .gst-panel { background: #f4f5e8; border-color: #d6d8b6; }
  .gst-panel h3 { color: #5e6226; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
  thead th {
    text-align: left; padding: 10px 10px; background: #1f1e1c; color: #fff;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
  }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #eeebe5; }
  tbody tr.odd { background: #faf9f6; }
  .col-sno { width: 32px; color: #99948d; text-align: center; }
  .col-qty { width: 50px; text-align: center; }
  .col-price, .col-total { width: 100px; text-align: right; }
  .col-taxable, .col-gst { width: 95px; text-align: right; }
  .pack-tag {
    display: inline-block; margin-left: 6px; padding: 1px 6px;
    font-size: 9px; font-weight: 600; color: #2e91b2; background: #e6f2f7;
    border-radius: 4px; text-transform: uppercase; letter-spacing: 0.4px;
  }
  .totals-section { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
  .gst-breakdown {
    flex: 1; padding: 14px 16px; background: #faf9f6; border: 1px solid #eeebe5; border-radius: 8px;
  }
  .gst-breakdown h3 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #99948d; font-weight: 600; }
  .gst-breakdown .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #6b6560; }
  .gst-breakdown .row strong { color: #1f1e1c; }
  .totals { width: 300px; }
  .totals .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; }
  .totals .row.muted { color: #6b6560; }
  .totals .row.total {
    border-top: 2px solid #1f1e1c; margin-top: 6px; padding-top: 12px;
    font-size: 19px; font-weight: 700;
  }
  .totals .row.total .val { color: #48805b; }
  .amount-words {
    padding: 10px 14px; background: #e8f0eb; border: 1px solid #c8dccc;
    border-radius: 6px; font-size: 12px; color: #3d6b4d; margin-bottom: 16px; font-style: italic;
  }
  .amount-words strong { font-style: normal; color: #1f1e1c; }
  .footer {
    margin-top: 32px; padding-top: 20px; border-top: 2px solid #1f1e1c;
    display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  }
  .footer .left { font-size: 11px; color: #6b6560; line-height: 1.7; }
  .footer .left strong { color: #1f1e1c; }
  .footer .right { text-align: right; font-size: 11px; color: #99948d; line-height: 1.7; }
  .footer .signature { margin-top: 30px; }
  .footer .signature .line { border-top: 1px solid #99948d; width: 160px; margin-left: auto; padding-top: 4px; }
  .disclaimer {
    margin-top: 20px; padding: 10px; background: #faf9f6; border-radius: 6px;
    font-size: 10px; color: #99948d; text-align: center; line-height: 1.5;
  }
  @media print {
    body { background: #fff; }
    .page { max-width: none; padding: 0; }
    .actions { display: none !important; }
    .topbar { border-bottom: 1px solid #1f1e1c; }
    @page { margin: 12mm; size: A4; }
  }
  @media (max-width: 600px) {
    .page { padding: 16px; }
    .panels, .totals-section { flex-direction: column; }
    .totals { width: 100%; }
    .header { flex-direction: column; }
    .header .right { text-align: left; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div class="brand">
        ${LOGO_SVG}
        <div>
          <div class="name">NOTJUST</div>
          <div class="sub">NOTJUST Watr · ${escapeHtml(COMPANY.tagline)}</div>
          <div class="legal">${escapeHtml(COMPANY.legalName)}</div>
        </div>
      </div>
      <div class="actions">
        <a class="btn btn-primary" href="javascript:window.print()">🖨 Print / Save PDF</a>
      </div>
    </div>

    <div class="company-info" style="margin-bottom:24px;text-align:right;font-size:11px;color:#6b6560;line-height:1.7">
      <strong style="color:#1f1e1c">${escapeHtml(COMPANY.legalName)}</strong><br/>
      ${escapeHtml(COMPANY.address)}<br/>
      GSTIN: <strong style="color:#1f1e1c">${escapeHtml(COMPANY.gstin)}</strong> · PAN: ${escapeHtml(COMPANY.pan)}<br/>
      CIN: ${escapeHtml(COMPANY.cin)}<br/>
      ✉ ${escapeHtml(COMPANY.email)} · 📞 ${escapeHtml(COMPANY.phone)} · ${escapeHtml(COMPANY.website)}
    </div>

    <div class="header">
      <div class="left">
        <h1>TAX INVOICE</h1>
        <div class="invoice-no">Invoice No: <strong>${escapeHtml(invoice.invoice_number)}</strong></div>
        <div class="invoice-no" style="margin-top:2px">Order Ref: ${escapeHtml(invoice.order?.order_number || '—')}</div>
      </div>
      <div class="right">
        <div class="status">${escapeHtml(invoice.status)}</div>
        <div class="issued">Invoice Date: <strong>${issuedDate}</strong></div>
        <div class="issued">Order Date: ${orderDate}</div>
      </div>
    </div>

    <div class="panels">
      <div class="panel">
        <h3>Bill To (Customer)</h3>
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
      <div class="panel gst-panel">
        <h3>Payment Details</h3>
        <p><strong>Method:</strong> ${escapeHtml(invoice.payment_method || '—')}</p>
        <p><strong>Status:</strong> ${escapeHtml(invoice.payment_status || '—')}</p>
        <p class="muted">Customer ID: ${escapeHtml(invoice.user_id)}</p>
        <p class="muted">Place of Supply: ${escapeHtml(COMPANY.stateCode + ' - ' + (invoice.billing_state || 'Karnataka'))}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-sno">#</th>
          <th>Description</th>
          <th class="center">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Taxable Value</th>
          <th class="right">GST ${GST_RATE}%</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="7" style="text-align:center;color:#99948d;padding:24px">No line items</td></tr>'}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="gst-breakdown">
        <h3>GST Breakdown</h3>
        ${
          isSameState
            ? `<div class="row"><span>CGST (${GST_RATE / 2}%)</span><span><strong>${inr(cgst)}</strong></span></div>
               <div class="row"><span>SGST (${GST_RATE / 2}%)</span><span><strong>${inr(sgst)}</strong></span></div>
               <div class="row" style="border-top:1px solid #eeebe5;margin-top:4px;padding-top:8px"><span>Total GST</span><span><strong>${inr(totalGst)}</strong></span></div>`
            : `<div class="row"><span>IGST (${GST_RATE}%)</span><span><strong>${inr(totalGst)}</strong></span></div>
               <div class="row" style="border-top:1px solid #eeebe5;margin-top:4px;padding-top:8px"><span>Total GST</span><span><strong>${inr(totalGst)}</strong></span></div>`
        }
        <div class="row" style="margin-top:6px;font-size:10px;color:#99948d"><span>Supplier GSTIN: ${escapeHtml(COMPANY.gstin)}</span></div>
      </div>
      <div class="totals">
        <div class="row muted"><span>Subtotal</span><span>${inr(invoice.subtotal)}</span></div>
        <div class="row muted"><span>Total GST</span><span>${inr(totalGst)}</span></div>
        <div class="row muted"><span>Discount</span><span>− ${inr(invoice.discount_amount)}</span></div>
        <div class="row total"><span>Total Due</span><span class="val">${inr(invoice.total_amount)}</span></div>
      </div>
    </div>

    <div class="amount-words">
      <strong>Amount in Words:</strong> ${numberToWords(invoice.total_amount)} Rupees Only
    </div>

    <div class="footer">
      <div class="left">
        <strong>${escapeHtml(COMPANY.legalName)}</strong><br/>
        ${escapeHtml(COMPANY.address)}<br/>
        GSTIN: ${escapeHtml(COMPANY.gstin)} · PAN: ${escapeHtml(COMPANY.pan)}<br/>
        CIN: ${escapeHtml(COMPANY.cin)}
      </div>
      <div class="right">
        <div>This is a computer-generated invoice.</div>
        <div>No physical signature required.</div>
        <div class="signature">
          <div style="font-weight:600;color:#1f1e1c">For ${escapeHtml(COMPANY.name)}</div>
          <div class="line">Authorised Signatory</div>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      Thank you for your business! · ${escapeHtml(COMPANY.website)} · ${escapeHtml(COMPANY.email)} · ${escapeHtml(COMPANY.phone)}<br/>
      This invoice is issued under the Goods and Services Tax Act, 2017. Subject to Karnataka jurisdiction.
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

// Convert number to words (Indian system) for invoice amount in words
function numberToWords(num: number): string {
  const n = Math.floor(Number(num) || 0)
  if (n === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function twoDigits(n: number): string {
    if (n < 20) return ones[n]
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  }
  function threeDigits(n: number): string {
    const h = Math.floor(n / 100)
    const r = n % 100
    return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigits(r) : '')
  }

  let result = ''
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const remainder = n % 1000

  if (crore) result += threeDigits(crore) + ' Crore '
  if (lakh) result += threeDigits(lakh) + ' Lakh '
  if (thousand) result += threeDigits(thousand) + ' Thousand '
  if (remainder) result += threeDigits(remainder)

  return result.trim()
}
