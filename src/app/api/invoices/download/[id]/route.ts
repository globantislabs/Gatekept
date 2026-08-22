import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/download/[id]
// Returns a clean, single-page printable HTML invoice with:
// - NotJust logo image
// - Company GSTIN, address, CIN, PAN
// - Bill To (customer details)
// - Line items table with GST breakdown
// - Amount in words
// - Signature block
// Auto-generates if invoice doesn't exist yet.

const LOGO_URL = 'https://notjustwatr.com/images/notjust-logo-clean.png'

const COMPANY = {
  legalName: 'Zum Heilen Healthcare Private Limited',
  brand: 'NOTJUST',
  product: 'NOTJUST Watr',
  tagline: 'Wellness, simplified.',
  gstin: '29AAACZ8161A2ZA',
  pan: 'AAACZ8161A',
  cin: 'U74999KA2022PTC163096',
  address: '9/36, 203, Vaishnavi Sapphire Centre, 2nd Floor, Tumkur Road, Yeshwanthpura, Bengaluru, Karnataka 560022',
  email: 'info@zh-onehealth.com',
  phone: '+91 79940 04422',
  website: 'notjustwatr.com',
  stateCode: '29',
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function inr(n: number): string {
  return `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function numberToWords(num: number): string {
  const n = Math.floor(Number(num) || 0)
  if (n === 0) return 'Zero'
  const o = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const w = (n: number): string => {
    if (n < 20) return o[n]
    if (n < 100) return t[Math.floor(n / 10)] + (n % 10 ? ' ' + o[n % 10] : '')
    if (n < 1000) return o[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + w(n % 100) : '')
    if (n < 100000) return w(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + w(n % 1000) : '')
    if (n < 10000000) return w(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + w(n % 100000) : '')
    return w(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + w(n % 10000000) : '')
  }
  return w(n)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, order_number: true, status: true, created_at: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  if (!invoice) {
    return new Response('<h1 style="font-family:sans-serif;padding:40px">Invoice not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  let lineItems: Array<{ name: string; quantity: number; unit_price: number; total_price: number; pack_type?: string | null }> = []
  try { lineItems = JSON.parse(invoice.items || '[]') } catch { lineItems = [] }

  const issuedDate = new Date(invoice.issued_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  const orderDate = invoice.order?.created_at ? new Date(invoice.order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : issuedDate

  const totalGst = Number(invoice.tax_amount) || 0
  const cgst = totalGst / 2
  const sgst = totalGst / 2
  const GST_RATE = 18

  const itemRows = lineItems.map((it, i) => {
    const lineTotal = Number(it.total_price) || 0
    const taxableValue = lineTotal / (1 + GST_RATE / 100)
    const itemGst = lineTotal - taxableValue
    return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${escapeHtml(it.name || '—')}${it.pack_type ? `<br/><span style="font-size:9px;color:#999">${escapeHtml(it.pack_type.replace(/_/g, ' '))}</span>` : ''}</td>
      <td style="text-align:center">${it.quantity || 1}</td>
      <td style="text-align:right">${inr(it.unit_price)}</td>
      <td style="text-align:right">${inr(taxableValue)}</td>
      <td style="text-align:right">${inr(itemGst)}</td>
      <td style="text-align:right;font-weight:600">${inr(lineTotal)}</td>
    </tr>`
  }).join('')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice ${escapeHtml(invoice.invoice_number)} · NOTJUST</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1f1e1c;background:#f4f3f0;font-size:13px}
.page{max-width:800px;margin:0 auto;padding:28px;background:#fff;min-height:100vh}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1f1e1c;padding-bottom:16px;margin-bottom:20px}
.brand{display:flex;align-items:center;gap:12px}
.brand img{height:44px;width:auto}
.brand .nm{font-size:18px;font-weight:800;letter-spacing:-.3px}
.brand .sb{font-size:10px;color:#6b6560;margin-top:1px}
.btn{padding:7px 14px;border-radius:6px;border:1px solid #e3dfd8;background:#fff;color:#1f1e1c;font-size:12px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
.btn:hover{background:#f4f3f0}
.co{text-align:right;font-size:10px;color:#6b6560;line-height:1.6}
.co b{color:#1f1e1c}
.hdr{display:flex;justify-content:space-between;margin-bottom:18px}
.hdr h1{font-size:22px;letter-spacing:-.5px}
.hdr .ino{font-size:12px;color:#6b6560;margin-top:2px}
.hdr .r{text-align:right}
.st{display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.pn{display:flex;gap:12px;margin-bottom:18px}
.pn>div{flex:1;padding:12px 14px;background:#faf9f6;border:1px solid #eeebe5;border-radius:8px}
.pn h3{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#99948d;margin-bottom:6px;font-weight:700}
.pn p{margin:2px 0;font-size:12px;line-height:1.5}
.pn .m{color:#6b6560}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px}
th{background:#1f1e1c;color:#fff;padding:8px;font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:600}
th.r{text-align:right}th.c{text-align:center}
td{padding:7px 8px;border-bottom:1px solid #eeebe5}
td.r{text-align:right}td.c{text-align:center}
.tr{display:flex;justify-content:space-between;gap:16px;margin-bottom:16px}
.gst{flex:1;padding:12px;background:#faf9f6;border:1px solid #eeebe5;border-radius:8px}
.gst h3{font-size:9px;text-transform:uppercase;color:#99948d;margin-bottom:6px;font-weight:700}
.gst .row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;color:#6b6560}
.gst .row b{color:#1f1e1c}
.tot{width:260px}
.tot .row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}
.tot .m{color:#6b6560}
.tot .tt{border-top:2px solid #1f1e1c;margin-top:4px;padding-top:8px;font-size:17px;font-weight:700}
.tot .tt .v{color:#48805b}
.aw{padding:8px 12px;background:#e8f0eb;border:1px solid #c8dccc;border-radius:6px;font-size:11px;color:#3d6b4d;font-style:italic;margin-bottom:16px}
.aw b{font-style:normal;color:#1f1e1c}
.ft{border-top:2px solid #1f1e1c;padding-top:14px;margin-top:20px;display:flex;justify-content:space-between;gap:20px}
.ft .l{font-size:10px;color:#6b6560;line-height:1.6}
.ft .l b{color:#1f1e1c}
.ft .r{text-align:right;font-size:10px;color:#99948d;line-height:1.6}
.ft .sig{margin-top:24px}
.ft .sig .ln{border-top:1px solid #999;width:140px;margin-left:auto;padding-top:3px;font-size:9px}
.dis{text-align:center;font-size:9px;color:#99948d;margin-top:14px;line-height:1.5}
@media print{body{background:#fff}.page{max-width:none;padding:0}.btn{display:none!important}@page{margin:10mm;size:A4}}
@media(max-width:600px){.page{padding:14px}.pn,.tr{flex-direction:column}.tot{width:100%}.hdr{flex-direction:column}.hdr .r{text-align:left}}
</style></head><body>
<div class="page">
  <div class="top">
    <div class="brand">
      <img src="${LOGO_URL}" alt="NOTJUST"/>
      <div><div class="nm">${COMPANY.brand}</div><div class="sb">${COMPANY.product} · ${COMPANY.tagline}</div></div>
    </div>
    <div class="btn" onclick="window.print()">🖨 Print / Save PDF</div>
  </div>
  <div class="co" style="text-align:right;margin-bottom:16px">
    <b>${COMPANY.legalName}</b><br/>${COMPANY.address}<br/>
    GSTIN: <b>${COMPANY.gstin}</b> · PAN: ${COMPANY.pan}<br/>
    CIN: ${COMPANY.cin} · 📞 ${COMPANY.phone} · ✉ ${COMPANY.email} · ${COMPANY.website}
  </div>
  <div class="hdr">
    <div>
      <h1>TAX INVOICE</h1>
      <div class="ino">Invoice No: <b>${escapeHtml(invoice.invoice_number)}</b></div>
      <div class="ino">Order Ref: ${escapeHtml(invoice.order?.order_number || '—')}</div>
    </div>
    <div class="r">
      <div class="st" style="background:${invoice.status === 'PAID' ? '#e8f0eb' : '#fdf5e6'};color:${invoice.status === 'PAID' ? '#48805b' : '#c4880e'}">${escapeHtml(invoice.status)}</div>
      <div class="ino">Invoice Date: <b>${issuedDate}</b></div>
      <div class="ino">Order Date: ${orderDate}</div>
    </div>
  </div>
  <div class="pn">
    <div>
      <h3>Bill To</h3>
      <p><b>${escapeHtml(invoice.customer_name)}</b></p>
      ${invoice.customer_phone ? `<p class="m">📞 ${escapeHtml(invoice.customer_phone)}</p>` : ''}
      ${invoice.customer_email ? `<p class="m">✉ ${escapeHtml(invoice.customer_email)}</p>` : ''}
      ${invoice.billing_address ? `<p class="m">${escapeHtml(invoice.billing_address)}${invoice.billing_city ? `, ${escapeHtml(invoice.billing_city)}` : ''}${invoice.billing_state ? `, ${escapeHtml(invoice.billing_state)}` : ''}${invoice.billing_pincode ? ` - ${escapeHtml(invoice.billing_pincode)}` : ''}</p>` : ''}
    </div>
    <div>
      <h3>Payment</h3>
      <p><b>Method:</b> ${escapeHtml(invoice.payment_method || '—')}</p>
      <p><b>Status:</b> ${escapeHtml(invoice.payment_status || '—')}</p>
      <p class="m">Place of Supply: ${COMPANY.stateCode} - Karnataka</p>
    </div>
  </div>
  <table>
    <thead><tr>
      <th class="c" style="width:30px">#</th><th>Description</th>
      <th class="c" style="width:40px">Qty</th>
      <th class="r">Unit Price</th>
      <th class="r">Taxable</th>
      <th class="r">GST ${GST_RATE}%</th>
      <th class="r">Amount</th>
    </tr></thead>
    <tbody>${itemRows || '<tr><td colspan="7" style="text-align:center;color:#999;padding:16px">No items</td></tr>'}</tbody>
  </table>
  <div class="tr">
    <div class="gst">
      <h3>GST Breakdown</h3>
      <div class="row"><span>CGST (${GST_RATE / 2}%)</span><span><b>${inr(cgst)}</b></span></div>
      <div class="row"><span>SGST (${GST_RATE / 2}%)</span><span><b>${inr(sgst)}</b></span></div>
      <div class="row" style="border-top:1px solid #eeebe5;margin-top:4px;padding-top:6px"><span>Total GST</span><span><b>${inr(totalGst)}</b></span></div>
      <div class="row" style="font-size:9px;color:#999;margin-top:4px"><span>Supplier GSTIN: ${COMPANY.gstin}</span></div>
    </div>
    <div class="tot">
      <div class="row m"><span>Subtotal</span><span>${inr(invoice.subtotal)}</span></div>
      <div class="row m"><span>Total GST</span><span>${inr(totalGst)}</span></div>
      <div class="row m"><span>Discount</span><span>− ${inr(invoice.discount_amount)}</span></div>
      <div class="row tt"><span>Total Due</span><span class="v">${inr(invoice.total_amount)}</span></div>
    </div>
  </div>
  <div class="aw"><b>Amount in Words:</b> ${numberToWords(invoice.total_amount)} Rupees Only</div>
  <div class="ft">
    <div class="l"><b>${COMPANY.legalName}</b><br/>${COMPANY.address}<br/>GSTIN: ${COMPANY.gstin} · PAN: ${COMPANY.pan}<br/>CIN: ${COMPANY.cin}</div>
    <div class="r"><div>Computer-generated invoice — no signature required.</div><div class="sig"><div style="font-weight:700;color:#1f1e1c">For ${COMPANY.brand}</div><div class="ln">Authorised Signatory</div></div></div>
  </div>
  <div class="dis">Thank you for your business! · ${COMPANY.website} · ${COMPANY.phone}</div>
</div>
</body></html>`

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
