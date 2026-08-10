#!/usr/bin/env python3
"""
Generate a professional QA Bug Report PDF with CodeRabbit styling.
Uses Playwright to render HTML→PDF for pixel-perfect dark theme output.
"""

import re
import json
import subprocess
import sys
import os
from pathlib import Path

# ─── Parse bugs from TSX ──────────────────────────────────────────────
def parse_bugs(tsx_path: str) -> list[dict]:
    """Extract all bug objects from the QATestReport.tsx file."""
    with open(tsx_path, 'r') as f:
        content = f.read()

    bugs = []
    # Find each bug object and extract fields using a more robust approach
    # Match each { id: '...' } block
    bug_pattern = r"\{\s*id:\s*'([^']+?)'"
    
    for m in re.finditer(bug_pattern, content):
        start = m.start()
        # Find the closing brace
        depth = 0
        end = start
        for i in range(start, len(content)):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        
        block = content[start:end]
        
        # Extract fields - handle both single-quoted and template literal strings
        def extract_field(field_name):
            # Try single-quoted string first
            pat = rf"{field_name}:\s*'((?:[^'\\]|\\.)*)'"
            match = re.search(pat, block)
            if match:
                return match.group(1).replace("\\'", "'")
            return ""
        
        bug_id = m.group(1)
        severity = extract_field('severity')
        category = extract_field('category')
        component = extract_field('component')
        location = extract_field('location')
        title = extract_field('title')
        description = extract_field('description')
        impact = extract_field('impact')
        fix = extract_field('fix')
        
        if severity and title:
            bugs.append({
                'id': bug_id,
                'severity': severity,
                'category': category,
                'component': component,
                'location': location,
                'title': title,
                'description': description,
                'impact': impact,
                'fix': fix,
            })

    return bugs


# ─── CodeRabbit SVG Logo (exact style) ────────────────────────────────
CODERABBIT_LOGO_SVG = '''
<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <defs>
    <linearGradient id="cr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="cr-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>
  </defs>
  <!-- Background circle -->
  <circle cx="120" cy="120" r="110" fill="url(#cr-bg)"/>
  <circle cx="120" cy="120" r="100" fill="none" stroke="url(#cr-stroke)" stroke-width="1.5" opacity="0.4"/>
  <!-- Rabbit body -->
  <ellipse cx="120" cy="140" rx="40" ry="34" fill="#e2e8f0" opacity="0.95"/>
  <!-- Left ear -->
  <ellipse cx="96" cy="80" rx="12" ry="32" fill="#e2e8f0" opacity="0.95" transform="rotate(-15 96 80)"/>
  <ellipse cx="96" cy="80" rx="6" ry="24" fill="#a855f7" opacity="0.35" transform="rotate(-15 96 80)"/>
  <!-- Right ear -->
  <ellipse cx="144" cy="80" rx="12" ry="32" fill="#e2e8f0" opacity="0.95" transform="rotate(15 144 80)"/>
  <ellipse cx="144" cy="80" rx="6" ry="24" fill="#a855f7" opacity="0.35" transform="rotate(15 144 80)"/>
  <!-- Eyes -->
  <circle cx="106" cy="133" r="6" fill="#a855f7"/>
  <circle cx="134" cy="133" r="6" fill="#a855f7"/>
  <circle cx="107.5" cy="131.5" r="2.5" fill="#fff"/>
  <circle cx="135.5" cy="131.5" r="2.5" fill="#fff"/>
  <!-- Nose -->
  <ellipse cx="120" cy="147" rx="5" ry="3.5" fill="#14b8a6" opacity="0.8"/>
  <!-- Mouth -->
  <path d="M115 151 Q120 156 125 151" fill="none" stroke="#94a3b8" stroke-width="1" opacity="0.5"/>
  <!-- Code brackets -->
  <text x="120" y="172" text-anchor="middle" font-family="monospace" font-size="18" fill="#14b8a6" opacity="0.6">&lt;/&gt;</text>
</svg>
'''

# ─── Generate HTML Report ─────────────────────────────────────────────
def generate_html(bugs: list[dict], output_path: str):
    """Generate a professional HTML report with CodeRabbit dark theme."""

    severity_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
    category_counts: dict[str, int] = {}
    for b in bugs:
        severity_counts[b['severity']] = severity_counts.get(b['severity'], 0) + 1
        category_counts[b['category']] = category_counts.get(b['category'], 0) + 1

    severity_colors = {
        'Critical': {'bg': '#1c0f0f', 'border': '#ef4444', 'text': '#fca5a5', 'badge': '#ef4444', 'dot': '#ef4444'},
        'High':     {'bg': '#1c1509', 'border': '#f97316', 'text': '#fdba74', 'badge': '#f97316', 'dot': '#f97316'},
        'Medium':   {'bg': '#1c1a09', 'border': '#eab308', 'text': '#fde047', 'badge': '#eab308', 'dot': '#eab308'},
        'Low':      {'bg': '#0f1629', 'border': '#3b82f6', 'text': '#93c5fd', 'badge': '#3b82f6', 'dot': '#3b82f6'},
    }

    # Sort bugs by severity order
    severity_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    sorted_bugs = sorted(bugs, key=lambda b: (severity_order.get(b['severity'], 99), b['id']))

    html_parts = []

    # ── Head & CSS ──
    html_parts.append('''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CodeRabbit QA Bug Report - NOTJUST Watr</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #0f0f23;
    color: #e2e8f0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 9.5px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Cover Page ── */
  .cover {
    width: 210mm; min-height: 297mm;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
    padding: 40mm 30mm;
    background: #0f0f23;
    page-break-after: always;
  }
  .cover-logo { margin-bottom: 20px; }
  .cover-brand {
    font-size: 42pt; font-weight: 900; letter-spacing: -1.5px;
    background: linear-gradient(135deg, #a855f7 0%, #14b8a6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 4px;
  }
  .cover-tagline {
    font-size: 11pt; font-weight: 400; color: #94a3b8;
    letter-spacing: 6px; text-transform: uppercase;
    margin-bottom: 36px;
  }
  .cover-project {
    font-size: 22pt; font-weight: 700; color: #e2e8f0;
    margin-bottom: 4px;
  }
  .cover-subtitle2 {
    font-size: 10pt; color: #64748b; margin-bottom: 44px;
  }
  .cover-grid {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  }
  .cover-card {
    background: #1a1a2e; border: 1px solid #2a2a4a;
    border-radius: 10px; padding: 14px 22px;
    min-width: 90px; text-align: center;
  }
  .cover-card-num {
    font-size: 30pt; font-weight: 800; line-height: 1;
  }
  .cover-card-label {
    font-size: 7pt; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1.2px; margin-top: 5px;
  }
  .cover-total {
    margin-top: 28px;
    font-size: 9pt; color: #475569; letter-spacing: 2px; text-transform: uppercase;
  }
  .cover-footer-line {
    margin-top: 40px;
    width: 80px; height: 2px;
    background: linear-gradient(90deg, #a855f7, #14b8a6);
    border-radius: 1px;
  }

  /* ── Content Pages ── */
  .content-page {
    width: 210mm; min-height: 297mm;
    padding: 16mm 16mm 20mm 16mm;
    background: #0f0f23;
    page-break-after: always;
  }

  /* Page header bar */
  .page-topbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; padding-bottom: 6px;
    border-bottom: 1px solid #1e1e3a;
  }
  .page-topbar-left {
    display: flex; align-items: center; gap: 8px;
  }
  .page-topbar-logo { width: 18px; height: 18px; }
  .page-topbar-title {
    font-size: 8pt; font-weight: 600; color: #64748b;
    letter-spacing: 1px; text-transform: uppercase;
  }
  .page-topbar-right {
    font-size: 7.5pt; color: #475569; font-family: 'JetBrains Mono', monospace;
  }

  /* Section headers */
  .section-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px; padding-bottom: 6px;
    border-bottom: 1px solid #2a2a4a;
  }
  .section-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .section-title {
    font-size: 13pt; font-weight: 700; color: #e2e8f0;
  }
  .section-count {
    font-size: 8pt; font-weight: 600; color: #94a3b8;
    background: #1a1a2e; border: 1px solid #2a2a4a;
    border-radius: 4px; padding: 1px 6px; margin-left: auto;
  }

  /* Bug cards - compact */
  .bug {
    background: #151528; border: 1px solid #252545;
    border-radius: 6px; margin-bottom: 7px;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .bug-top {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 7px 10px 4px 10px;
  }
  .bug-id-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt; font-weight: 600;
    padding: 1px 5px; border-radius: 3px;
    white-space: nowrap; flex-shrink: 0;
    letter-spacing: 0.3px;
  }
  .bug-info { flex: 1; min-width: 0; }
  .bug-title {
    font-size: 9.5pt; font-weight: 600; color: #e2e8f0; line-height: 1.3;
  }
  .bug-tags {
    display: flex; align-items: center; gap: 5px;
    margin-top: 2px; flex-wrap: wrap;
  }
  .bug-tag {
    font-size: 6.5pt; font-weight: 600;
    padding: 0.5px 4px; border-radius: 2px;
    text-transform: uppercase; letter-spacing: 0.4px;
  }
  .bug-loc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.5pt; color: #475569;
  }
  .bug-details {
    padding: 0 10px 6px 10px;
  }
  .bug-field { margin-bottom: 3px; }
  .bug-field-label {
    font-size: 6.5pt; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: 0.8px;
    display: inline; margin-right: 4px;
  }
  .bug-field-text {
    font-size: 8.5pt; color: #cbd5e1; line-height: 1.45;
    display: inline;
  }
  .bug-fix {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt; color: #14b8a6; line-height: 1.4;
    background: #0c2520; padding: 3px 7px;
    border-radius: 3px; border-left: 2px solid #14b8a6;
    margin-top: 2px; display: block;
  }

  /* Summary section */
  .summary-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 12px;
  }
  .summary-card {
    background: #151528; border: 1px solid #252545;
    border-radius: 6px; padding: 10px 12px;
  }
  .summary-card-title {
    font-size: 7pt; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
  }
  .s-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 2px 0;
  }
  .s-label { font-size: 8.5pt; color: #cbd5e1; }
  .s-value { font-size: 9pt; font-weight: 700; }
  .bar-track {
    height: 3px; background: #1e1e3a; border-radius: 1.5px;
    margin-top: 2px; overflow: hidden;
  }
  .bar-fill { height: 100%; border-radius: 1.5px; }

  .key-findings {
    background: #151528; border: 1px solid #252545;
    border-radius: 6px; padding: 10px 12px; margin-bottom: 10px;
  }
  .kf-title {
    font-size: 7pt; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
  }
  .kf-text {
    font-size: 8.5pt; color: #cbd5e1; line-height: 1.6;
  }
  .kf-text p { margin-bottom: 5px; }

  /* Footer */
  .page-footer {
    margin-top: auto; padding-top: 6px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 6.5pt; color: #334155;
    border-top: 1px solid #1a1a2e;
  }
</style>
</head>
<body>
''')

    # ── Cover Page ──
    total = len(bugs)
    html_parts.append(f'''
<div class="cover">
  <div class="cover-logo">{CODERABBIT_LOGO_SVG}</div>
  <div class="cover-brand">CodeRabbit</div>
  <div class="cover-tagline">QA Bug Hunter Report</div>
  <div class="cover-project">NOTJUST Watr</div>
  <div class="cover-subtitle2">E-Commerce Platform &middot; Full-Stack QA Analysis</div>
  <div class="cover-grid">
    <div class="cover-card">
      <div class="cover-card-num" style="color: #ef4444;">{severity_counts['Critical']}</div>
      <div class="cover-card-label">Critical</div>
    </div>
    <div class="cover-card">
      <div class="cover-card-num" style="color: #f97316;">{severity_counts['High']}</div>
      <div class="cover-card-label">High</div>
    </div>
    <div class="cover-card">
      <div class="cover-card-num" style="color: #eab308;">{severity_counts['Medium']}</div>
      <div class="cover-card-label">Medium</div>
    </div>
    <div class="cover-card">
      <div class="cover-card-num" style="color: #3b82f6;">{severity_counts['Low']}</div>
      <div class="cover-card-label">Low</div>
    </div>
  </div>
  <div class="cover-total">{total} issues identified</div>
  <div class="cover-footer-line"></div>
</div>
''')

    # ── Summary Page ──
    sorted_cats = sorted(category_counts.items(), key=lambda x: -x[1])

    cat_rows = ''
    for cat, cnt in sorted_cats:
        pct = cnt / total * 100
        cat_rows += f'<div class="s-row"><span class="s-label">{cat}</span><span class="s-value" style="color:#a855f7;">{cnt}</span></div><div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:#a855f7;opacity:0.7;"></div></div>'

    sev_rows = ''
    for sev in ['Critical', 'High', 'Medium', 'Low']:
        cnt = severity_counts.get(sev, 0)
        pct = cnt / total * 100 if total > 0 else 0
        c = severity_colors[sev]
        sev_rows += f'<div class="s-row"><span class="s-label">{sev}</span><span class="s-value" style="color:{c["badge"]};">{cnt}</span></div><div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:{c["badge"]};opacity:0.7;"></div></div>'

    comp_counts: dict[str, int] = {}
    for b in bugs:
        comp_counts[b['component']] = comp_counts.get(b['component'], 0) + 1
    sorted_comps = sorted(comp_counts.items(), key=lambda x: -x[1])

    comp_rows = ''
    for comp, cnt in sorted_comps[:8]:
        pct = cnt / total * 100
        comp_rows += f'<div class="s-row"><span class="s-label">{comp}</span><span class="s-value" style="color:#14b8a6;">{cnt}</span></div><div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:#14b8a6;opacity:0.7;"></div></div>'

    html_parts.append(f'''
<div class="content-page">
  <div class="page-topbar">
    <div class="page-topbar-left">
      <span class="page-topbar-title">CodeRabbit QA Report</span>
    </div>
    <span class="page-topbar-right">NOTJUST Watr</span>
  </div>

  <div class="section-header">
    <span class="section-title">Analysis Summary</span>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-card-title">By Severity</div>
      {sev_rows}
    </div>
    <div class="summary-card">
      <div class="summary-card-title">By Category</div>
      {cat_rows}
    </div>
  </div>

  <div class="summary-card" style="margin-bottom:10px;">
    <div class="summary-card-title">Top Affected Components</div>
    {comp_rows}
  </div>

  <div class="key-findings">
    <div class="kf-title">Key Findings</div>
    <div class="kf-text">
      <p><strong style="color:#ef4444;">Critical Security Vulnerabilities:</strong> Unsalted SHA-256 password hashing, forgeable session tokens, client-controlled pricing, and IDOR vulnerabilities expose the platform to complete authentication bypass and financial loss.</p>
      <p><strong style="color:#f97316;">State Management Issues:</strong> Race conditions, infinite retry loops, and stale closures in product detail and admin panels can cause wrong data display, API DDOS, and blank screens.</p>
      <p><strong style="color:#eab308;">Logic Errors:</strong> Tax calculated on pre-discount subtotal overcharges customers. Phone numbers sent un-normalized cause login failures. Quiz reorder crosses video boundaries.</p>
      <p><strong style="color:#3b82f6;">UX Defects:</strong> Double-submit on checkout, missing loading states, inaccessible elements, and layout shifts degrade user experience across all flows.</p>
    </div>
  </div>

  <div class="page-footer">
    <span>CodeRabbit QA Report</span>
    <span>Page 2</span>
  </div>
</div>
''')

    # ── Bug Detail Pages (flowing content, no forced page breaks between severities) ──
    # We'll create pages with flowing content and let CSS handle page breaks
    current_severity = None
    page_num = 3

    # Group bugs by severity for headers
    severity_groups = {}
    for bug in sorted_bugs:
        sev = bug['severity']
        if sev not in severity_groups:
            severity_groups[sev] = []
        severity_groups[sev].append(bug)

    # Generate each severity section
    for sev_name in ['Critical', 'High', 'Medium', 'Low']:
        if sev_name not in severity_groups:
            continue
        group = severity_groups[sev_name]
        c = severity_colors[sev_name]

        html_parts.append(f'''
<div class="content-page">
  <div class="page-topbar">
    <div class="page-topbar-left">
      <span class="page-topbar-title">CodeRabbit QA Report</span>
    </div>
    <span class="page-topbar-right">NOTJUST Watr &middot; {sev_name}</span>
  </div>

  <div class="section-header">
    <span class="section-dot" style="background:{c["dot"]};"></span>
    <span class="section-title" style="color:{c["text"]};">{sev_name} Severity</span>
    <span class="section-count">{len(group)} issues</span>
  </div>
''')

        for bug in group:
            # Escape HTML entities in text fields
            def esc(s):
                return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

            bug_html = f'''
  <div class="bug" style="border-left:3px solid {c["border"]};">
    <div class="bug-top">
      <span class="bug-id-tag" style="background:{c["badge"]}18;color:{c["badge"]};border:1px solid {c["badge"]}33;">{esc(bug["id"])}</span>
      <div class="bug-info">
        <div class="bug-title">{esc(bug["title"])}</div>
        <div class="bug-tags">
          <span class="bug-tag" style="background:{c["badge"]}18;color:{c["badge"]};">{sev_name}</span>
          <span class="bug-tag" style="background:#a855f718;color:#a855f7;">{esc(bug["category"])}</span>
          <span class="bug-tag" style="background:#14b8a618;color:#14b8a6;">{esc(bug["component"])}</span>
          <span class="bug-loc">{esc(bug["location"])}</span>
        </div>
      </div>
    </div>
    <div class="bug-details">
      <div class="bug-field">
        <span class="bug-field-label">Desc:</span>
        <span class="bug-field-text">{esc(bug["description"])}</span>
      </div>
      <div class="bug-field">
        <span class="bug-field-label">Impact:</span>
        <span class="bug-field-text" style="color:{c["text"]};">{esc(bug["impact"])}</span>
      </div>
      <div class="bug-field">
        <span class="bug-field-label">Fix:</span>
      </div>
      <div class="bug-fix">{esc(bug["fix"])}</div>
    </div>
  </div>
'''
            html_parts.append(bug_html)

        html_parts.append(f'''
  <div class="page-footer">
    <span>CodeRabbit QA Report</span>
    <span>Page {page_num}</span>
  </div>
</div>
''')
        page_num += 1

    html_parts.append('</body></html>')

    with open(output_path, 'w') as f:
        f.write('\n'.join(html_parts))

    print(f"HTML report written to {output_path}")


# ─── Main ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    project_dir = '/home/z/my-project'
    tsx_path = f'{project_dir}/src/components/QATestReport.tsx'
    html_path = f'{project_dir}/qa-report-coderabbit.html'
    pdf_path = f'{project_dir}/QA-Bug-Hunter-Report-CodeRabbit.pdf'

    # Step 1: Parse bugs
    bugs = parse_bugs(tsx_path)
    print(f"Parsed {len(bugs)} bugs from TSX file")

    if len(bugs) == 0:
        print("ERROR: No bugs found!")
        sys.exit(1)

    # Print bug IDs for verification
    bug_ids = sorted([b['id'] for b in bugs])
    print(f"Bug IDs: {bug_ids}")

    # Step 2: Generate HTML
    generate_html(bugs, html_path)

    # Step 3: Convert to PDF using Playwright
    pdf_skill_dir = f'{project_dir}/skills/pdf'

    cmd = [
        'node',
        f'{pdf_skill_dir}/scripts/html2pdf-next.js',
        html_path,
        '--output', pdf_path,
        '--width', '210mm',
        '--height', '297mm',
        '--nopaged',
    ]

    print(f"Converting HTML to PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    print(result.stdout)
    if result.stderr:
        print(f"stderr: {result.stderr}")

    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"\n{'='*50}")
        print(f"PDF generated successfully!")
        print(f"File: {pdf_path}")
        print(f"Size: {size_kb:.1f} KB")
        print(f"{'='*50}")
    else:
        print(f"ERROR: PDF not found at {pdf_path}")
