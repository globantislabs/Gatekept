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

// Local copy of the brand logo (public/images) — renders in its true green→lime colors.
const LOGO_URL = '/images/notjust-logo-clean.png'

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
      order: {
        select: {
          id: true, order_number: true, status: true, created_at: true,
          shipping_name: true, shipping_phone: true, shipping_email: true,
          shipping_address: true, shipping_city: true, shipping_state: true, shipping_pincode: true,
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  if (!invoice) {
    return new Response('<h1 style="font-family:sans-serif;padding:40px">Invoice not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  let lineItems: Array<{ name: string; quantity: number; unit_price: number; total_price: number; pack_type?: string | null }> = []
  try { lineItems = JSON.parse(invoice.items || '[]') } catch { lineItems = [] }

  // Pin dates to Indian Standard Time — the server may run in UTC, which would
  // otherwise show yesterday's date for orders placed early morning IST.
  const issuedDate = new Date(invoice.issued_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' })
  const orderDate = invoice.order?.created_at ? new Date(invoice.order.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' }) : issuedDate

  const totalGst = Number(invoice.tax_amount) || 0
  const cgst = totalGst / 2
  const sgst = totalGst / 2
  const GST_RATE = 18

  const itemRows = lineItems.map((it, i) => {
    const lineTotal = Number(it.total_price) || 0
    const taxableValue = lineTotal / (1 + GST_RATE / 100)
    const itemGst = lineTotal - taxableValue
    return `<tr>
      <td class="c">${i + 1}</td>
      <td>${escapeHtml(it.name || '—')}${it.pack_type ? `<br/><span class="sub">${escapeHtml(it.pack_type.replace(/_/g, ' '))}</span>` : ''}</td>
      <td class="c">${it.quantity || 1}</td>
      <td class="r">${inr(it.unit_price)}</td>
      <td class="r">${inr(taxableValue)}</td>
      <td class="r">${inr(itemGst)}</td>
      <td class="r amt">${inr(lineTotal)}</td>
    </tr>`
  }).join('')

  // ─── Address helpers: format = Name → Address → Email → Mobile ───
  const billingAddressLine = invoice.billing_address
    ? `${escapeHtml(invoice.billing_address)}${invoice.billing_city ? `, ${escapeHtml(invoice.billing_city)}` : ''}${invoice.billing_state ? `, ${escapeHtml(invoice.billing_state)}` : ''}${invoice.billing_pincode ? ` - ${escapeHtml(invoice.billing_pincode)}` : ''}`
    : ''

  const ship = invoice.order || ({} as Record<string, string | null>)
  const shipName = (ship as any).shipping_name || invoice.customer_name
  const shipAddressLine = (ship as any).shipping_address
    ? `${escapeHtml((ship as any).shipping_address)}${(ship as any).shipping_city ? `, ${escapeHtml((ship as any).shipping_city)}` : ''}${(ship as any).shipping_state ? `, ${escapeHtml((ship as any).shipping_state)}` : ''}${(ship as any).shipping_pincode ? ` - ${escapeHtml((ship as any).shipping_pincode)}` : ''}`
    : billingAddressLine
  const shipEmail = (ship as any).shipping_email || invoice.customer_email
  const shipPhone = (ship as any).shipping_phone || invoice.customer_phone
  const hasShipInfo = !!(shipAddressLine || shipEmail || shipPhone)

  // Display-only status chip coloring: PAID → brand green, CANCELLED → neutral, others → amber.
  const statusText = String(invoice.status || '').toUpperCase()
  const chipClass = statusText === 'PAID' ? 'st paid' : statusText === 'CANCELLED' ? 'st cancelled' : 'st due'

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice ${escapeHtml(invoice.invoice_number)} · NOTJUST</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1e1c;background:#efeeec;font-size:13px;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:820px;margin:20px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 28px rgba(31,30,28,.10)}
.bar{height:6px;background:linear-gradient(90deg,#3d7050 0%,#48805b 40%,#afb75d 100%);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.inner{padding:30px 36px 26px}
.top{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid #e7e4de;margin-bottom:14px}
/* Brand logo shown in its natural green→lime colors */
.brand img{height:46px;width:auto;display:block}
.btn{padding:9px 16px;border:none;border-radius:7px;background:#48805b;color:#fff;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.2px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:background .15s}
.btn:hover{background:#3a6a4a}
.co{text-align:right;font-size:10px;color:#57524a;line-height:1.7;margin-bottom:18px}
.co b{color:#1f1e1c;font-weight:600}
.hdr{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:20px}
.hdr h1{font-size:25px;font-weight:800;letter-spacing:-.5px;color:#1f1e1c;line-height:1.1}
.hdr .accent{width:58px;height:4px;border-radius:2px;background:linear-gradient(90deg,#48805b,#afb75d);margin-top:7px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hdr .ino{font-size:11.5px;color:#57524a;margin-top:9px}
.hdr .ino b{color:#1f1e1c;font-weight:600}
.hdr .r{text-align:right}
.st{display:inline-block;padding:4px 12px;border-radius:999px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.st.paid{background:#e8f0eb;color:#2e6142;border:1px solid #c2d6c9}
.st.due{background:#fdf5e6;color:#9a6a0d;border:1px solid #ecd9b0}
.st.cancelled{background:#efeeec;color:#3f3b35;border:1px solid #dcd8d0}
.pn{display:flex;gap:12px;margin-bottom:20px}
.pn>div{flex:1;padding:13px 15px;background:#f9f8f6;border:1px solid #e7e4de;border-radius:9px}
.pn h3{font-size:9.5px;text-transform:uppercase;letter-spacing:1px;color:#48805b;margin-bottom:7px;font-weight:700}
.pn p{margin:2px 0;font-size:12px;line-height:1.55;color:#1f1e1c}
.pn .m{color:#3f3b35}
table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:16px;font-size:11.5px;border:1px solid #e7e4de;border-radius:9px;overflow:hidden}
th{background:#48805b;color:#fff;padding:9px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
th.r{text-align:right}th.c{text-align:center}
td{padding:8px 10px;border-top:1px solid #eeede9;color:#1f1e1c;vertical-align:top;background:#fff}
tbody tr:nth-child(even) td{background:#fafaf7}
td .sub{font-size:9px;color:#57524a;text-transform:uppercase;letter-spacing:.4px}
td.r{text-align:right;font-variant-numeric:tabular-nums}td.c{text-align:center}
td.amt,.amt{font-weight:700}
.tr{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}
.gst{flex:1;padding:13px 15px;background:#f9f8f6;border:1px solid #e7e4de;border-radius:9px}
.gst h3{font-size:9.5px;text-transform:uppercase;letter-spacing:1px;color:#48805b;margin-bottom:7px;font-weight:700}
.gst .row{display:flex;justify-content:space-between;padding:3px 0;font-size:11.5px;color:#3f3b35}
.gst .row b{color:#1f1e1c;font-weight:600;font-variant-numeric:tabular-nums}
.tot{width:280px;padding:13px 15px;border:1px solid #e7e4de;border-radius:9px;background:#fff}
.tot .row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#3f3b35}
.tot .row span+span{font-variant-numeric:tabular-nums;font-weight:600;color:#1f1e1c}
.tot .tt{margin-top:8px;padding:11px 13px;background:#48805b;border-radius:8px;font-size:15px;font-weight:800;color:#fff;display:flex;justify-content:space-between;align-items:center;letter-spacing:.2px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.tot .tt .v{font-variant-numeric:tabular-nums}
.aw{padding:10px 14px;background:#f5f6e9;border:1px solid #e5e8cf;border-radius:9px;font-size:11px;color:#3f3b35;font-style:italic;margin-bottom:16px}
.aw b{font-style:normal;color:#1f1e1c;font-weight:600}
.ft{border-top:1px solid #e7e4de;padding-top:16px;margin-top:6px;display:flex;justify-content:flex-end;gap:20px}
.ft .r{text-align:right;font-size:10px;color:#57524a;line-height:1.6}
.ft .sig{margin-top:22px}
.ft .sig .who{font-weight:700;color:#48805b;font-size:11px;letter-spacing:.3px}
.ft .sig .ln{border-top:1px solid #c9c4bb;width:175px;margin-left:auto;padding-top:4px;font-size:9px;color:#57524a}
.dis{text-align:center;font-size:9.5px;color:#57524a;margin-top:16px;padding-top:12px;border-top:1px dashed #e0ddd6;line-height:1.6}
.dis b{color:#48805b;font-weight:700}
@media print{body{background:#fff}.page{margin:0;max-width:none;border-radius:0;box-shadow:none}.inner{padding:10mm 12mm}.btn{display:none!important}@page{margin:0;size:A4}}
@media(max-width:600px){.inner{padding:18px}.pn,.tr{flex-direction:column}.tot{width:100%}.hdr{flex-direction:column;align-items:flex-start}.hdr .r{text-align:left;margin-top:10px}.co{text-align:left}}
</style></head><body>
<div class="page">
  <div class="bar"></div>
  <div class="inner">
  <div class="top">
    <div class="brand">
      <img src="${LOGO_URL}" alt="NOTJUST"/>
    </div>
    <div class="btn" onclick="window.print()">Print / Save PDF</div>
  </div>
  <div class="co" style="text-align:right;margin-bottom:16px">
    <b>${COMPANY.legalName}</b><br/>${COMPANY.address}<br/>
    GSTIN: <b>${COMPANY.gstin}</b> · PAN: ${COMPANY.pan}<br/>
    CIN: ${COMPANY.cin} · Phone: ${COMPANY.phone} · Email: ${COMPANY.email} · ${COMPANY.website}
  </div>
  <div class="hdr">
    <div>
      <h1>TAX INVOICE</h1>
      <div class="accent"></div>
      <div class="ino">Invoice No: <b>${escapeHtml(invoice.invoice_number)}</b></div>
      <div class="ino">Order Ref: ${escapeHtml(invoice.order?.order_number || '—')}</div>
    </div>
    <div class="r">
      <div class="st ${chipClass}">${escapeHtml(invoice.status)}</div>
      <div class="ino">Invoice Date: <b>${issuedDate}</b></div>
      <div class="ino">Order Date: ${orderDate}</div>
    </div>
  </div>
  <div class="pn">
    <div>
      <h3>Bill To</h3>
      <p><b>${escapeHtml(invoice.customer_name)}</b></p>
      ${billingAddressLine ? `<p class="m">${billingAddressLine}</p>` : ''}
      ${invoice.customer_email ? `<p class="m">Email: ${escapeHtml(invoice.customer_email)}</p>` : ''}
      ${invoice.customer_phone ? `<p class="m">Mob: ${escapeHtml(invoice.customer_phone)}</p>` : ''}
    </div>
    ${hasShipInfo ? `
    <div>
      <h3>Ship To</h3>
      <p><b>${escapeHtml(shipName)}</b></p>
      ${shipAddressLine ? `<p class="m">${shipAddressLine}</p>` : ''}
      ${shipEmail ? `<p class="m">Email: ${escapeHtml(shipEmail)}</p>` : ''}
      ${shipPhone ? `<p class="m">Mob: ${escapeHtml(shipPhone)}</p>` : ''}
    </div>` : ''}
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
    <tbody>${itemRows || '<tr><td colspan="7" style="text-align:center;color:#57524a;padding:16px">No items</td></tr>'}</tbody>
  </table>
  <div class="tr">
    <div class="gst">
      <h3>GST Breakdown</h3>
      <div class="row"><span>CGST (${GST_RATE / 2}%)</span><span><b>${inr(cgst)}</b></span></div>
      <div class="row"><span>SGST (${GST_RATE / 2}%)</span><span><b>${inr(sgst)}</b></span></div>
      <div class="row" style="border-top:1px solid #e0ddd6;margin-top:4px;padding-top:6px"><span>Total GST</span><span><b>${inr(totalGst)}</b></span></div>
      <div class="row" style="font-size:9px;color:#57524a;margin-top:4px"><span>Supplier GSTIN: ${COMPANY.gstin}</span></div>
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
    <div class="r"><div>Computer-generated invoice — no signature required.</div><div class="sig"><div class="who">For ${COMPANY.brand}</div><div class="ln">Authorised Signatory</div></div></div>
  </div>
  <div class="dis">Thank you for your business! · <b>${COMPANY.website}</b> · ${COMPANY.phone}</div>
  </div>
</div>
</body></html>`

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
