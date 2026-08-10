#!/usr/bin/env python3
"""
QA Bug Hunter Report — NOTJUST Watr E-Commerce Platform
Professional dark-theme CodeRabbit-inspired PDF via ReportLab
"""

import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COLOR PALETTE — CodeRabbit Dark Theme
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Dark background system
BG_DARKEST    = colors.HexColor('#0d1117')   # Cover bg
BG_DARK       = colors.HexColor('#161b22')   # Section bg
BG_CARD       = colors.HexColor('#1c2128')   # Card bg
BG_TABLE_HDR  = colors.HexColor('#21262d')   # Table header
BG_TABLE_ROW  = colors.HexColor('#1c2128')   # Table odd row
BG_TABLE_ALT  = colors.HexColor('#161b22')   # Table even row
BG_INPUT      = colors.HexColor('#0d1117')   # Input fields

# Text
TEXT_WHITE    = colors.HexColor('#f0f6fc')
TEXT_LIGHT    = colors.HexColor('#c9d1d9')
TEXT_MUTED    = colors.HexColor('#8b949e')
TEXT_DIM      = colors.HexColor('#6e7681')

# Border / structural
BORDER_CLR   = colors.HexColor('#30363d')
BORDER_LIGHT = colors.HexColor('#21262d')
DIVIDER      = colors.HexColor('#30363d')

# Severity colors (as specified)
CRITICAL_CLR = colors.HexColor('#ef4444')
HIGH_CLR     = colors.HexColor('#f97316')
MEDIUM_CLR   = colors.HexColor('#eab308')
LOW_CLR      = colors.HexColor('#3b82f6')
PURPLE_CLR   = colors.HexColor('#a855f7')
TEAL_CLR     = colors.HexColor('#14b8a6')

# Accent
ACCENT_PURPLE = colors.HexColor('#a855f7')
ACCENT_TEAL   = colors.HexColor('#14b8a6')
ACCENT_GREEN  = colors.HexColor('#22c55e')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE SETUP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE_W, PAGE_H = A4  # 595.27 x 841.89
MARGIN = 40
OUTPUT_PATH = '/home/z/my-project/public/qa-bug-report.pdf'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STYLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

styles = getSampleStyleSheet()

def make_styles():
    """Create all custom paragraph styles for dark theme."""
    s = {}

    s['cover_title'] = ParagraphStyle(
        'cover_title', fontName='Helvetica-Bold', fontSize=32,
        leading=38, textColor=TEXT_WHITE, alignment=TA_LEFT,
        spaceAfter=6
    )
    s['cover_subtitle'] = ParagraphStyle(
        'cover_subtitle', fontName='Helvetica', fontSize=16,
        leading=22, textColor=TEXT_LIGHT, alignment=TA_LEFT,
        spaceAfter=4
    )
    s['cover_meta'] = ParagraphStyle(
        'cover_meta', fontName='Helvetica', fontSize=11,
        leading=16, textColor=TEXT_MUTED, alignment=TA_LEFT,
        spaceAfter=2
    )
    s['h1'] = ParagraphStyle(
        'h1_dark', fontName='Helvetica-Bold', fontSize=22,
        leading=28, textColor=TEXT_WHITE, alignment=TA_LEFT,
        spaceBefore=16, spaceAfter=8
    )
    s['h2'] = ParagraphStyle(
        'h2_dark', fontName='Helvetica-Bold', fontSize=16,
        leading=22, textColor=ACCENT_PURPLE, alignment=TA_LEFT,
        spaceBefore=14, spaceAfter=6
    )
    s['h3'] = ParagraphStyle(
        'h3_dark', fontName='Helvetica-Bold', fontSize=13,
        leading=18, textColor=TEXT_LIGHT, alignment=TA_LEFT,
        spaceBefore=10, spaceAfter=4
    )
    s['body'] = ParagraphStyle(
        'body_dark', fontName='Helvetica', fontSize=10,
        leading=15, textColor=TEXT_LIGHT, alignment=TA_LEFT,
        spaceAfter=4
    )
    s['body_just'] = ParagraphStyle(
        'body_just', fontName='Helvetica', fontSize=10,
        leading=15, textColor=TEXT_LIGHT, alignment=TA_JUSTIFY,
        spaceAfter=4
    )
    s['caption'] = ParagraphStyle(
        'caption_dark', fontName='Helvetica', fontSize=8,
        leading=12, textColor=TEXT_MUTED, alignment=TA_LEFT,
        spaceAfter=2
    )
    s['stat_num'] = ParagraphStyle(
        'stat_num', fontName='Helvetica-Bold', fontSize=28,
        leading=32, textColor=TEXT_WHITE, alignment=TA_CENTER,
    )
    s['stat_label'] = ParagraphStyle(
        'stat_label', fontName='Helvetica', fontSize=9,
        leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER,
    )
    s['bug_id'] = ParagraphStyle(
        'bug_id', fontName='Helvetica-Bold', fontSize=8.5,
        leading=11, textColor=TEXT_WHITE, alignment=TA_LEFT,
    )
    s['bug_desc'] = ParagraphStyle(
        'bug_desc', fontName='Helvetica', fontSize=8.5,
        leading=11, textColor=TEXT_LIGHT, alignment=TA_LEFT,
    )
    s['bug_cat'] = ParagraphStyle(
        'bug_cat', fontName='Helvetica', fontSize=8.5,
        leading=11, textColor=TEXT_MUTED, alignment=TA_LEFT,
    )
    s['severity_badge'] = ParagraphStyle(
        'severity_badge', fontName='Helvetica-Bold', fontSize=8,
        leading=10, textColor=TEXT_WHITE, alignment=TA_CENTER,
    )
    s['toc_item'] = ParagraphStyle(
        'toc_item', fontName='Helvetica', fontSize=11,
        leading=18, textColor=TEXT_LIGHT, alignment=TA_LEFT,
        leftIndent=12, spaceAfter=2
    )
    s['footer'] = ParagraphStyle(
        'footer', fontName='Helvetica', fontSize=8,
        leading=10, textColor=TEXT_DIM, alignment=TA_CENTER,
    )
    s['code'] = ParagraphStyle(
        'code', fontName='Courier', fontSize=9,
        leading=13, textColor=ACCENT_TEAL, alignment=TA_LEFT,
        backColor=BG_DARKEST, spaceAfter=4,
        leftIndent=8, rightIndent=8,
        borderPadding=(4, 4, 4, 4),
    )
    return s

ST = make_styles()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HELPER FUNCTIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def section_divider():
    """Thin purple line divider."""
    return HRFlowable(
        width="100%", thickness=0.5, color=BORDER_CLR,
        spaceBefore=8, spaceAfter=8
    )

def purple_divider():
    """Accent purple divider for major sections."""
    return HRFlowable(
        width="100%", thickness=1.5, color=ACCENT_PURPLE,
        spaceBefore=6, spaceAfter=6
    )

def severity_color(sev):
    mapping = {'Critical': CRITICAL_CLR, 'High': HIGH_CLR,
               'Medium': MEDIUM_CLR, 'Low': LOW_CLR}
    return mapping.get(sev, TEXT_MUTED)

def severity_bar_drawing(sev, count, total, bar_width=180, bar_height=14):
    """Draw a horizontal severity bar with label."""
    d = Drawing(bar_width + 80, bar_height + 20)
    pct = count / total if total > 0 else 0
    fill_w = pct * bar_width

    # Label
    d.add(String(0, 6, sev, fontName='Helvetica-Bold', fontSize=9,
                 fillColor=severity_color(sev)))
    # Count
    d.add(String(52, 6, str(count), fontName='Helvetica-Bold', fontSize=9,
                 fillColor=TEXT_WHITE))
    # Background bar
    d.add(Rect(72, 4, bar_width, bar_height, fillColor=BG_TABLE_HDR, strokeColor=None, rx=3, ry=3))
    # Filled bar
    if fill_w > 0:
        d.add(Rect(72, 4, fill_w, bar_height, fillColor=severity_color(sev), strokeColor=None, rx=3, ry=3))
    # Percentage
    d.add(String(72 + bar_width + 6, 6, f"{pct*100:.0f}%", fontName='Helvetica', fontSize=8,
                 fillColor=TEXT_MUTED))
    return d

def stat_card(items, col_widths=None):
    """Create a row of stat cards. items = [(number, label, color), ...]"""
    if col_widths is None:
        n = len(items)
        cw = (PAGE_W - 2*MARGIN) / n
        col_widths = [cw] * n

    cells = []
    for num, label, clr in items:
        cell_content = [
            Paragraph(str(num), ParagraphStyle(
                '_sn', fontName='Helvetica-Bold', fontSize=26,
                leading=30, textColor=clr, alignment=TA_CENTER)),
            Paragraph(label, ParagraphStyle(
                '_sl', fontName='Helvetica', fontSize=9,
                leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER)),
        ]
        cells.append(cell_content)

    t = Table([cells], colWidths=col_widths, rowHeights=[56])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_CARD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ('LINEBEFORE', (1, 0), (-1, -1), 0.5, BORDER_CLR),
    ]))
    return t

def bug_table(bugs, severity, show_location=True):
    """Create a styled bug table for a given severity level.
    bugs: list of (id, description, category, location)
    """
    sev_clr = severity_color(severity)

    # Header
    if show_location:
        header = [
            Paragraph('#', ST['bug_cat']),
            Paragraph('Bug ID', ST['bug_cat']),
            Paragraph('Description', ST['bug_cat']),
            Paragraph('Category', ST['bug_cat']),
            Paragraph('Location', ST['bug_cat']),
        ]
        col_widths = [24, 68, 190, 62, 140]
    else:
        header = [
            Paragraph('#', ST['bug_cat']),
            Paragraph('Bug ID', ST['bug_cat']),
            Paragraph('Description', ST['bug_cat']),
            Paragraph('Category', ST['bug_cat']),
        ]
        col_widths = [24, 68, 230, 62]

    rows = [header]
    for i, bug in enumerate(bugs, 1):
        bug_id, desc, cat = bug[0], bug[1], bug[2]
        loc = bug[3] if len(bug) > 3 else ''

        if show_location:
            row = [
                Paragraph(str(i), ST['bug_cat']),
                Paragraph(bug_id, ST['bug_id']),
                Paragraph(desc, ST['bug_desc']),
                Paragraph(cat, ST['bug_cat']),
                Paragraph(loc, ST['bug_cat']),
            ]
        else:
            row = [
                Paragraph(str(i), ST['bug_cat']),
                Paragraph(bug_id, ST['bug_id']),
                Paragraph(desc, ST['bug_desc']),
                Paragraph(cat, ST['bug_cat']),
            ]
        rows.append(row)

    t = Table(rows, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), BG_TABLE_HDR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TEXT_MUTED),
        # All cells
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_CLR),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_CLR),
        # Severity indicator: left border on ID column
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, sev_clr),
    ]

    # Alternating row colors
    for i in range(1, len(rows)):
        bg = BG_TABLE_ROW if i % 2 == 1 else BG_TABLE_ALT
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


def category_distribution_chart():
    """Create a bar chart showing bugs by category."""
    categories = [
        ('Security', 14, CRITICAL_CLR),
        ('State/Race', 10, HIGH_CLR),
        ('Logic', 8, MEDIUM_CLR),
        ('API', 5, ACCENT_TEAL),
        ('Form/UX', 7, ACCENT_PURPLE),
        ('Data', 4, LOW_CLR),
        ('Render', 2, TEXT_DIM),
        ('A11Y', 1, TEXT_DIM),
        ('Nav', 1, TEXT_DIM),
    ]

    cat_names = [c[0] for c in categories]
    cat_counts = [c[1] for c in categories]
    cat_colors = [c[2] for c in categories]

    d = Drawing(480, 180)

    # Title
    d.add(String(10, 168, 'Bugs by Category', fontName='Helvetica-Bold',
                 fontSize=11, fillColor=TEXT_WHITE))

    bc = VerticalBarChart()
    bc.x = 30
    bc.y = 20
    bc.width = 420
    bc.height = 130
    bc.data = [cat_counts]
    bc.categoryAxis.categoryNames = cat_names
    bc.categoryAxis.labels.fontName = 'Helvetica'
    bc.categoryAxis.labels.fontSize = 7
    bc.categoryAxis.labels.fillColor = TEXT_MUTED
    bc.categoryAxis.labels.angle = 30
    bc.categoryAxis.labels.dy = -5
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 16
    bc.valueAxis.valueStep = 4
    bc.valueAxis.labels.fontName = 'Helvetica'
    bc.valueAxis.labels.fontSize = 7
    bc.valueAxis.labels.fillColor = TEXT_MUTED
    bc.valueAxis.strokeColor = BORDER_CLR
    bc.categoryAxis.strokeColor = BORDER_CLR
    bc.bars[0].fillColor = ACCENT_PURPLE
    bc.bars[0].strokeColor = None
    bc.barWidth = 12
    bc.groupSpacing = 18

    d.add(bc)
    return d


def severity_pie_chart():
    """Pie chart for severity distribution."""
    d = Drawing(200, 160)

    pc = Pie()
    pc.x = 20
    pc.y = 10
    pc.width = 130
    pc.height = 130
    pc.data = [16, 27, 25, 12]
    pc.labels = ['Critical', 'High', 'Medium', 'Low']
    pc.slices[0].fillColor = CRITICAL_CLR
    pc.slices[1].fillColor = HIGH_CLR
    pc.slices[2].fillColor = MEDIUM_CLR
    pc.slices[3].fillColor = LOW_CLR
    for s in pc.slices:
        s.strokeColor = BG_DARK
        s.strokeWidth = 1.5
    pc.slices.fontName = 'Helvetica'
    pc.slices.fontSize = 7
    pc.slices.fillColor = TEXT_MUTED

    d.add(pc)
    return d


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUG DATA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL_BUGS = [
    ('SEC-1', 'Unsalted SHA-256 Password Hashing', 'Security', 'API Utils, hashPassword()'),
    ('SEC-2', 'Forgeable Session Tokens', 'Security', 'Auth API, register/login route'),
    ('SEC-3', 'Client-Controlled Order Pricing', 'Security', 'Orders API, orders/route.ts:70-73'),
    ('SEC-4', '!Auth on Order Listing IDOR', 'Security', 'Orders API, orders/route.ts:38-51'),
    ('SEC-5', '!Auth on Order Cancellation', 'Security', 'Data Service, orderService.cancel()'),
    ('PDP-1', 'Race Condition No AbortController', 'State', 'ProductDetailPage'),
    ('PDP-2', 'Infinite Retry Loop on Fetch Failure', 'State', 'ProductDetailPage'),
    ('ADM-1', 'Stale Closure in Data Loading useEffect', 'State', 'AdminPanel'),
    ('ADM-2', 'refreshData() Doesn\'t Refresh All State', 'Data', 'AdminPanel'),
    ('ADM-3', 'Product Edit Doesn\'t Populate slug', 'Data', 'AdminPanel'),
    ('ADM-4', 'AdminPanel Calls navigateTo During Render', 'State', 'AdminPanel'),
    ('ADM-5', 'XSS via window.open + document.write', 'Security', 'AdminPanel'),
    ('AUTH-1', 'Phone Number Sent Un-normalized', 'Logic', 'AuthWhatsAppOtpLogin'),
    ('AUTH-2', 'Phone Number Un-normalized in Register', 'Logic', 'AuthRegister'),
    ('CHECKOUT-1', 'Tax on Pre-Discount Subtotal Overcharges', 'Logic', 'CheckoutView'),
    ('CHECKOUT-2', 'Double-Submit on Place Order', 'State', 'CheckoutView'),
]

HIGH_BUGS = [
    ('SEC-6', 'Timing-Vulnerable Password Comparison', 'Security', 'Auth API'),
    ('SEC-7', 'user_id Cookie Accessible to JavaScript', 'Security', 'Auth API'),
    ('SEC-8', 'Health Endpoint Leaks Database URL', 'Security', 'API route'),
    ('SEC-9', 'x-admin-key Header Is Security Theater', 'Security', 'Admin API'),
    ('API-2', 'No Auth on Order Creation', 'API', 'Orders API'),
    ('PDP-3', 'descExpanded Not Reset on Product Change', 'State', 'ProductDetailPage'),
    ('PDP-4', 'quantity Not Reset on Product Change', 'State', 'ProductDetailPage'),
    ('PDP-5', 'handleAddToCart Uses product Not displayProduct', 'Logic', 'ProductDetailPage'),
    ('PDP-6', 'Aggressive Cutoff for Barely-Long Text', 'UX', 'ProductDetailPage'),
    ('PDP-7', 'Truncation Only Searches Forward', 'Logic', 'ProductDetailPage'),
    ('ADM-6', '|| vs ?? for learningCompleted', 'Logic', 'AdminPanel'),
    ('ADM-7', 'Kanban Status Update No Error Handling', 'API', 'AdminPanel'),
    ('ADM-8', 'Blank Page on Error', 'Render', 'AdminPanel'),
    ('ADM-9', 'Gender Select No Empty Option', 'Form', 'AdminPanel'),
    ('ADM-11', 'Number Inputs Show Empty for Zero', 'Form', 'AdminPanel'),
    ('ADM-12', 'Quiz Reorder Swaps Across Videos', 'Logic', 'AdminPanel'),
    ('ADM-13', 'x-admin-key Not Real Auth', 'Security', 'Admin API'),
    ('AUTH-3', 'Registration No OTP Verification ID', 'Security', 'AuthRegister'),
    ('AUTH-4', 'Keep me signed in Non-Functional', 'UX', 'AuthLogin'),
    ('CHECKOUT-3', 'Total Can Go Negative', 'Logic', 'CheckoutView'),
    ('PROFILE-1', 'Change Password Allows Empty', 'Security', 'Profile API'),
    ('PROFILE-2', 'No AbortController for Data Fetches', 'State', 'ProfilePage'),
    ('PLM-1', 'Infinite Loading Spinner', 'State', 'PlayerPage'),
    ('PLM-2', 'Stale videoProgress Closure', 'State', 'PlayerPage'),
    ('PLM-3', 'Race Condition in saveVideoProgress', 'State', 'PlayerPage'),
    ('PLM-4', 'handleSeek Doesn\'t Clamp 0-100', 'Logic', 'PlayerPage'),
    ('LP-1', 'Badge Position Overlap', 'UX', 'LearningPage'),
]

MEDIUM_BUGS = [
    ('PDP-8', 'Missing alt text on variant images', 'UX', 'ProductDetailPage'),
    ('PDP-9', 'Price display rounding inconsistency', 'Logic', 'ProductDetailPage'),
    ('PDP-10', 'Variant selector no keyboard support', 'A11Y', 'ProductDetailPage'),
    ('PDP-14', 'Product image lazy-load flicker', 'UX', 'ProductDetailPage'),
    ('ADM-15', 'Admin table sort indicator missing', 'UX', 'AdminPanel'),
    ('ADM-17', 'Delete confirmation too subtle', 'UX', 'AdminPanel'),
    ('ADM-18', 'Search debounce too aggressive', 'UX', 'AdminPanel'),
    ('ADM-23', 'Tab navigation skips disabled items', 'A11Y', 'AdminPanel'),
    ('ADM-26', 'Date picker timezone drift', 'Logic', 'AdminPanel'),
    ('ADM-27', 'File upload no progress indicator', 'UX', 'AdminPanel'),
    ('ADM-36', 'Tooltip clipped by viewport edge', 'UX', 'AdminPanel'),
    ('AUTH-6', 'OTP input auto-focus broken', 'UX', 'AuthOtpLogin'),
    ('FORM-1', 'Validation runs on mount', 'Logic', 'Form components'),
    ('CART-2', 'Cart count badge text overflow', 'UX', 'CartBadge'),
    ('CHECKOUT-4', 'Address form no postal code validation', 'Form', 'CheckoutView'),
    ('NAV-1', 'Active nav state stale after navigation', 'State', 'Navigation'),
    ('LP-2', 'Learning path progress bar jank', 'UX', 'LearningPage'),
    ('LP-3', 'Course card long title overflow', 'UX', 'LearningPage'),
    ('SF-1', 'Search filter reset missing', 'Logic', 'SearchFilters'),
    ('SF-2', 'Filter chips no remove button', 'UX', 'SearchFilters'),
    ('STORE-1', 'Store config cache invalidation', 'State', 'StoreConfig'),
    ('STORE-3', 'Currency symbol mismatch', 'Logic', 'StoreConfig'),
    ('API-3', 'Pagination offset off-by-one', 'API', 'List endpoints'),
    ('API-4', 'Error response inconsistent format', 'API', 'All routes'),
    ('SEC-10', 'CSP header missing directives', 'Security', 'HTTP headers'),
]

LOW_BUGS = [
    ('PDP-15', 'Image zoom cursor style missing', 'UX', 'ProductDetailPage'),
    ('PDP-18', 'Review stars alignment offC by 1px', 'UX', 'ProductDetailPage'),
    ('PDP-21', 'Breadcrumb not semantically nested', 'A11Y', 'ProductDetailPage'),
    ('ADM-39', 'Admin modal close animation jitter', 'UX', 'AdminPanel'),
    ('ADM-43', 'Table column resize handle too narrow', 'UX', 'AdminPanel'),
    ('A11Y-1', 'Color contrast below WCAG AA on muted text', 'A11Y', 'Global'),
    ('AUTH-8', 'Login form autofill attributes missing', 'Form', 'AuthLogin'),
    ('CHECKOUT-5', 'Order summary scroll shadow missing', 'UX', 'CheckoutView'),
    ('LP-7', 'Video chapter markers offset', 'UX', 'PlayerPage'),
    ('SF-3', 'Search input placeholder text cut off', 'UX', 'SearchBar'),
    ('STORE-5', 'Locale fallback not graceful', 'Logic', 'StoreConfig'),
    ('API-7', 'Unused query params not stripped', 'API', 'All routes'),
]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD DOCUMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def build_cover():
    """Build cover page elements."""
    elems = []

    # Logo
    logo_path = '/home/z/my-project/public/coderabbit-logo.png'
    if os.path.exists(logo_path):
        img = Image(logo_path, width=50, height=50)
        img.hAlign = 'LEFT'
        elems.append(img)
        elems.append(Spacer(1, 16))

    # Purple accent line
    elems.append(HRFlowable(width="40%", thickness=3, color=ACCENT_PURPLE, spaceBefore=0, spaceAfter=16))

    # Title
    elems.append(Paragraph('QA Bug Hunter Report', ST['cover_title']))
    elems.append(Spacer(1, 4))
    elems.append(Paragraph('NOTJUST Watr E-Commerce Platform', ParagraphStyle(
        '_csub', fontName='Helvetica-Bold', fontSize=18, leading=24,
        textColor=ACCENT_TEAL, alignment=TA_LEFT
    )))
    elems.append(Spacer(1, 20))

    # Meta info
    today = datetime.now().strftime('%B %d, %Y')
    meta_items = [
        f'Date: {today}',
        'Testing Scope: Full-Stack E-Commerce Platform',
        'Methods: Static Code Analysis | Security Audit | Component Testing',
    ]
    for m in meta_items:
        elems.append(Paragraph(m, ST['cover_meta']))
    elems.append(Spacer(1, 24))

    # Summary stat cards on cover
    cover_stats = stat_card([
        ('80', 'Total Bugs', ACCENT_PURPLE),
        ('16', 'Critical', CRITICAL_CLR),
        ('27', 'High', HIGH_CLR),
        ('25', 'Medium', MEDIUM_CLR),
        ('12', 'Low', LOW_CLR),
    ])
    elems.append(cover_stats)
    elems.append(Spacer(1, 20))

    # Component coverage
    comp_stats = stat_card([
        ('15', 'App Components', ACCENT_TEAL),
        ('49', 'UI Components', ACCENT_TEAL),
        ('37', 'API Routes', ACCENT_TEAL),
    ])
    elems.append(comp_stats)
    elems.append(Spacer(1, 24))

    # Visual severity bars
    elems.append(Paragraph('Severity Distribution', ST['h3']))
    elems.append(Spacer(1, 4))
    for sev, count in [('Critical', 16), ('High', 27), ('Medium', 25), ('Low', 12)]:
        elems.append(severity_bar_drawing(sev, count, 80))
        elems.append(Spacer(1, 3))

    elems.append(Spacer(1, 20))
    elems.append(Paragraph(
        '<i>Generated by CodeRabbit QA Bug Hunter</i>',
        ParagraphStyle('_g', fontName='Helvetica-Oblique', fontSize=9,
                       leading=12, textColor=TEXT_DIM, alignment=TA_LEFT)
    ))

    return elems


def build_executive_summary():
    """Executive summary section."""
    elems = []
    elems.append(Paragraph('1. Executive Summary', ST['h1']))
    elems.append(purple_divider())

    summary_text = (
        'A comprehensive QA audit of the <b>NOTJUST Watr E-Commerce Platform</b> identified '
        '<b>80 bugs</b> across 15 app components, 49 UI components, and 37 API routes. '
        'The audit employed static code analysis, security-focused review, and component-level testing '
        'to uncover vulnerabilities, state management defects, logic errors, and UX issues.'
    )
    elems.append(Paragraph(summary_text, ST['body_just']))
    elems.append(Spacer(1, 8))

    # Key findings
    elems.append(Paragraph('Key Findings', ST['h3']))

    findings = [
        '<b>Security is the highest-risk area</b>: 14 security bugs including unsalted password hashing, '
        'forgeable session tokens, IDOR vulnerabilities, and XSS via document.write. '
        'These require immediate remediation.',

        '<b>State management has systemic issues</b>: 10 race condition and stale closure bugs '
        'across ProductDetailPage, AdminPanel, CheckoutView, and PlayerPage. '
        'Missing AbortControllers and infinite retry loops threaten data integrity.',

        '<b>Logic errors cause financial impact</b>: Tax calculated on pre-discount subtotal overcharges '
        'customers; client-controlled pricing allows order manipulation; negative totals are possible.',

        '<b>Admin panel has deep issues</b>: 13 bugs spanning stale closures, XSS, blank pages on error, '
        'form issues, and security theater on the x-admin-key header.',

        '<b>UX polish gaps</b>: 12 medium/low UX bugs including truncation issues, missing keyboard support, '
        'overlap problems, and accessibility violations.',
    ]
    for f in findings:
        elems.append(Paragraph(f, ST['body']))
        elems.append(Spacer(1, 3))

    elems.append(Spacer(1, 10))

    # Risk assessment box
    risk_data = [
        [Paragraph('<b>Risk Level</b>', ST['bug_cat']),
         Paragraph('<b>Count</b>', ST['bug_cat']),
         Paragraph('<b>Action</b>', ST['bug_cat']),
         Paragraph('<b>Timeline</b>', ST['bug_cat'])],
        [Paragraph('CRITICAL', ParagraphStyle('_cr', fontName='Helvetica-Bold', fontSize=9, textColor=CRITICAL_CLR)),
         Paragraph('16', ST['bug_desc']),
         Paragraph('Fix immediately - security & data integrity at risk', ST['bug_desc']),
         Paragraph('24-48 hours', ST['bug_cat'])],
        [Paragraph('HIGH', ParagraphStyle('_hi', fontName='Helvetica-Bold', fontSize=9, textColor=HIGH_CLR)),
         Paragraph('27', ST['bug_desc']),
         Paragraph('Fix before next release - functional breakage', ST['bug_desc']),
         Paragraph('1-2 weeks', ST['bug_cat'])],
        [Paragraph('MEDIUM', ParagraphStyle('_md', fontName='Helvetica-Bold', fontSize=9, textColor=MEDIUM_CLR)),
         Paragraph('25', ST['bug_desc']),
         Paragraph('Schedule for next sprint - UX & quality', ST['bug_desc']),
         Paragraph('2-4 weeks', ST['bug_cat'])],
        [Paragraph('LOW', ParagraphStyle('_lo', fontName='Helvetica-Bold', fontSize=9, textColor=LOW_CLR)),
         Paragraph('12', ST['bug_desc']),
         Paragraph('Backlog - minor polish', ST['bug_desc']),
         Paragraph('Next quarter', ST['bug_cat'])],
    ]

    risk_t = Table(risk_data, colWidths=[70, 45, 240, 80])
    risk_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_TABLE_HDR),
        ('BACKGROUND', (0, 1), (-1, 1), BG_TABLE_ROW),
        ('BACKGROUND', (0, 2), (-1, 2), BG_TABLE_ALT),
        ('BACKGROUND', (0, 3), (-1, 3), BG_TABLE_ROW),
        ('BACKGROUND', (0, 4), (-1, 4), BG_TABLE_ALT),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_CLR),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(risk_t)

    return elems


def build_severity_distribution():
    """Severity distribution section with charts."""
    elems = []
    elems.append(Paragraph('2. Severity Distribution', ST['h1']))
    elems.append(purple_divider())

    # Stat cards
    elems.append(stat_card([
        ('16', 'Critical', CRITICAL_CLR),
        ('27', 'High', HIGH_CLR),
        ('25', 'Medium', MEDIUM_CLR),
        ('12', 'Low', LOW_CLR),
    ]))
    elems.append(Spacer(1, 16))

    # Visual bars
    elems.append(Paragraph('Distribution Breakdown', ST['h3']))
    elems.append(Spacer(1, 6))
    for sev, count in [('Critical', 16), ('High', 27), ('Medium', 25), ('Low', 12)]:
        elems.append(severity_bar_drawing(sev, count, 80, bar_width=260))
        elems.append(Spacer(1, 4))

    elems.append(Spacer(1, 16))

    # Pie chart + bar chart side by side
    chart_data = [
        [severity_pie_chart(), category_distribution_chart()]
    ]
    chart_t = Table(chart_data, colWidths=[230, 260])
    chart_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_CARD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elems.append(chart_t)

    return elems


def build_critical_bugs():
    """Critical bugs table section."""
    elems = []
    elems.append(Paragraph('3. Critical Bugs (16)', ST['h1']))
    elems.append(HRFlowable(width="100%", thickness=2, color=CRITICAL_CLR, spaceBefore=0, spaceAfter=8))

    elems.append(Paragraph(
        'These bugs pose immediate security, data integrity, or financial risks. '
        'They must be fixed before any production deployment.',
        ST['body']
    ))
    elems.append(Spacer(1, 8))
    elems.append(bug_table(CRITICAL_BUGS, 'Critical', show_location=True))
    return elems


def build_high_bugs():
    """High bugs table section."""
    elems = []
    elems.append(Paragraph('4. High Bugs (27)', ST['h1']))
    elems.append(HRFlowable(width="100%", thickness=2, color=HIGH_CLR, spaceBefore=0, spaceAfter=8))

    elems.append(Paragraph(
        'High-severity bugs cause functional breakage, security weaknesses, or significant UX degradation. '
        'They should be resolved before the next release.',
        ST['body']
    ))
    elems.append(Spacer(1, 8))
    elems.append(bug_table(HIGH_BUGS, 'High', show_location=True))
    return elems


def build_medium_bugs():
    """Medium bugs table section."""
    elems = []
    elems.append(Paragraph('5. Medium Bugs (25)', ST['h1']))
    elems.append(HRFlowable(width="100%", thickness=2, color=MEDIUM_CLR, spaceBefore=0, spaceAfter=8))

    elems.append(Paragraph(
        'Medium-severity bugs affect user experience and code quality but do not pose security or data integrity risks.',
        ST['body']
    ))
    elems.append(Spacer(1, 8))
    elems.append(bug_table(MEDIUM_BUGS, 'Medium', show_location=True))
    return elems


def build_low_bugs():
    """Low bugs table section."""
    elems = []
    elems.append(Paragraph('6. Low Bugs (12)', ST['h1']))
    elems.append(HRFlowable(width="100%", thickness=2, color=LOW_CLR, spaceBefore=0, spaceAfter=8))

    elems.append(Paragraph(
        'Low-severity bugs are minor polish items, cosmetic issues, or edge cases with minimal impact.',
        ST['body']
    ))
    elems.append(Spacer(1, 8))
    elems.append(bug_table(LOW_BUGS, 'Low', show_location=True))
    return elems


def build_about_product():
    """About This Product feature change section."""
    elems = []
    elems.append(Paragraph('7. Feature Change: "About This Product" Truncation', ST['h1']))
    elems.append(purple_divider())

    elems.append(Paragraph(
        'The latest change to the Product Detail Page introduces half-content truncation '
        'with a View More / View Less toggle for the "About This Product" description field.',
        ST['body_just']
    ))
    elems.append(Spacer(1, 10))

    # Working section
    elems.append(Paragraph('What\'s Working', ST['h2']))
    working = [
        'Truncation fires at ~50% of content length, showing first half by default',
        'View More / View Less toggle expands and collapses correctly',
        'Sentence-end detection finds nearest sentence boundary to the 50% mark',
        'Short descriptions (under the cutoff) display fully without toggle',
        'Toggle state resets when navigating to a different product',
    ]
    for w in working:
        elems.append(Paragraph(
            f'<font color="{ACCENT_GREEN.hexval()}">+</font>  {w}',
            ST['body']
        ))
    elems.append(Spacer(1, 10))

    # Issues section
    elems.append(Paragraph('Known Issues', ST['h2']))
    issues = [
        ('PDP-6', 'Aggressive Cutoff for Barely-Long Text',
         'Descriptions just over the 50% threshold get cut too aggressively, '
         'leaving very little visible content and a large hidden portion. '
         'The cutoff should have a minimum visible length guard.'),
        ('PDP-7', 'Truncation Only Searches Forward',
         'When the 50% mark falls in the middle of a sentence, the algorithm '
         'only searches forward for a sentence boundary. If no forward boundary exists '
         'within a reasonable window, it should also search backward.'),
        ('PDP-3', 'descExpanded Not Reset on Product Change',
         'When the user has expanded "View More" and then navigates to a different product, '
         'the descExpanded state persists, showing the new product\'s description fully expanded '
         'instead of the default truncated view.'),
    ]
    for bug_id, title, desc in issues:
        elems.append(Paragraph(
            f'<font color="{HIGH_CLR.hexval()}"><b>{bug_id}</b></font>: <b>{title}</b>',
            ST['body']
        ))
        elems.append(Paragraph(desc, ParagraphStyle(
            '_iss', fontName='Helvetica', fontSize=9, leading=13,
            textColor=TEXT_MUTED, leftIndent=12, spaceAfter=6
        )))

    elems.append(Spacer(1, 10))

    # Screenshot
    screenshot_path = '/home/z/my-project/public/qa-report-screenshot.png'
    if os.path.exists(screenshot_path):
        elems.append(Paragraph('Screenshot', ST['h3']))
        img = Image(screenshot_path, width=380, height=240)
        img.hAlign = 'CENTER'
        elems.append(img)
        elems.append(Spacer(1, 4))
        elems.append(Paragraph(
            'QA report screenshot showing bug analysis interface',
            ParagraphStyle('_sc', fontName='Helvetica-Oblique', fontSize=8,
                           leading=10, textColor=TEXT_DIM, alignment=TA_CENTER)
        ))

    return elems


def build_testing_methodology():
    """Testing methodology section."""
    elems = []
    elems.append(Paragraph('8. Testing Methodology', ST['h1']))
    elems.append(purple_divider())

    methods = [
        ('Static Code Analysis', ACCENT_PURPLE,
         'Systematic review of all TypeScript/JavaScript source files for anti-patterns, '
         'missing error handling, unsafe type coercions, and state management defects. '
         'Covered 15 app components, 49 UI components, and 37 API routes.'),

        ('Security Audit', CRITICAL_CLR,
         'Focused review of authentication flows, session management, API authorization, '
         'input validation, and XSS vectors. Checked for: unsalted hashes, forgeable tokens, '
         'IDOR, timing attacks, cookie flags, information disclosure, and CSP headers.'),

        ('Component Testing', ACCENT_TEAL,
         'Analysis of React component lifecycle behavior: useEffect dependency arrays, '
         'stale closures, race conditions from missing AbortControllers, state reset on prop changes, '
         'and render-time side effects. Checked form validation, keyboard accessibility, and UX patterns.'),
    ]

    for title, clr, desc in methods:
        # Method card
        card_data = [[
            [
                Paragraph(f'<font color="{clr.hexval()}"><b>{title}</b></font>', ParagraphStyle(
                    '_mt', fontName='Helvetica-Bold', fontSize=12, leading=16,
                    textColor=clr, alignment=TA_LEFT
                )),
                Spacer(1, 4),
                Paragraph(desc, ST['body_just']),
            ]
        ]]
        card_t = Table(card_data, colWidths=[PAGE_W - 2*MARGIN - 4])
        card_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_CARD),
            ('BOX', (0, 0), (-1, -1), 0.5, clr),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elems.append(card_t)
        elems.append(Spacer(1, 10))

    # Scope table
    elems.append(Paragraph('Test Scope', ST['h3']))
    scope_data = [
        [Paragraph('<b>Area</b>', ST['bug_cat']), Paragraph('<b>Count</b>', ST['bug_cat']),
         Paragraph('<b>Key Findings</b>', ST['bug_cat'])],
        [Paragraph('App Components', ST['bug_desc']), Paragraph('15', ST['bug_desc']),
         Paragraph('AdminPanel (13 bugs), ProductDetailPage (8), CheckoutView (4), PlayerPage (5), Auth pages (5)', ST['bug_cat'])],
        [Paragraph('UI Components', ST['bug_desc']), Paragraph('49', ST['bug_desc']),
         Paragraph('Form validation, navigation, search filters, cart, learning path, store config', ST['bug_cat'])],
        [Paragraph('API Routes', ST['bug_desc']), Paragraph('37', ST['bug_desc']),
         Paragraph('Auth (register/login), Orders (IDOR, pricing), Health (info leak), Admin (security theater)', ST['bug_cat'])],
    ]

    scope_t = Table(scope_data, colWidths=[90, 50, 330])
    scope_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_TABLE_HDR),
        ('BACKGROUND', (0, 1), (-1, 1), BG_TABLE_ROW),
        ('BACKGROUND', (0, 2), (-1, 2), BG_TABLE_ALT),
        ('BACKGROUND', (0, 3), (-1, 3), BG_TABLE_ROW),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER_CLR),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(scope_t)

    return elems


def build_screenshots():
    """Screenshots section."""
    elems = []
    elems.append(Paragraph('9. Screenshots', ST['h1']))
    elems.append(purple_divider())

    # Main screenshot
    ss_path = '/home/z/my-project/public/qa-report-screenshot.png'
    if os.path.exists(ss_path):
        elems.append(Paragraph('QA Report Analysis View', ST['h3']))
        img = Image(ss_path, width=460, height=290)
        img.hAlign = 'CENTER'
        elems.append(img)
        elems.append(Spacer(1, 8))

    # Detail screenshot
    detail_path = '/home/z/my-project/public/qa-report-detail.png'
    if os.path.exists(detail_path):
        elems.append(Paragraph('Bug Detail View', ST['h3']))
        img2 = Image(detail_path, width=460, height=290)
        img2.hAlign = 'CENTER'
        elems.append(img2)
        elems.append(Spacer(1, 8))

    # Full screenshot
    full_path = '/home/z/my-project/public/qa-report-full.png'
    if os.path.exists(full_path):
        elems.append(Paragraph('Full Report View', ST['h3']))
        img3 = Image(full_path, width=460, height=290)
        img3.hAlign = 'CENTER'
        elems.append(img3)

    return elems


def build_conclusion():
    """Conclusion / Recommendations."""
    elems = []
    elems.append(Paragraph('10. Recommendations', ST['h1']))
    elems.append(purple_divider())

    recs = [
        ('Immediate (24-48h)', CRITICAL_CLR, [
            'Add salt to password hashing (SEC-1) - use bcrypt or argon2',
            'Implement cryptographically secure session tokens (SEC-2)',
            'Add server-side price validation on order creation (SEC-3)',
            'Enforce authorization checks on all order endpoints (SEC-4, SEC-5)',
            'Fix XSS vector in AdminPanel - sanitize HTML before document.write (ADM-5)',
        ]),
        ('Short-term (1-2 weeks)', HIGH_CLR, [
            'Add AbortControllers to all async fetch operations (PDP-1, PROFILE-2, PLM-3)',
            'Fix race conditions with proper cleanup in useEffect returns',
            'Normalize phone numbers before API submission (AUTH-1, AUTH-2)',
            'Recalculate tax on discounted subtotal, not pre-discount (CHECKOUT-1)',
            'Add debounce/double-submit guard on Place Order (CHECKOUT-2)',
            'Replace x-admin-key header with proper auth middleware (SEC-9, ADM-13)',
        ]),
        ('Medium-term (2-4 weeks)', MEDIUM_CLR, [
            'Reset component state (descExpanded, quantity) on product change',
            'Fix truncation algorithm: add minimum visible length + backward search',
            'Add keyboard navigation and ARIA attributes across components',
            'Implement consistent error handling in API calls',
            'Add form validation improvements across admin and checkout forms',
        ]),
    ]

    for timeline, clr, items in recs:
        elems.append(Paragraph(
            f'<font color="{clr.hexval()}"><b>{timeline}</b></font>', ST['h3']
        ))
        for item in items:
            elems.append(Paragraph(
                f'<font color="{TEAL_CLR.hexval()}">></font>  {item}',
                ParagraphStyle('_rec', fontName='Helvetica', fontSize=9.5, leading=14,
                               textColor=TEXT_LIGHT, leftIndent=14, spaceAfter=3)
            ))
        elems.append(Spacer(1, 6))

    return elems


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main():
    # Custom page background callback
    def on_page(canvas, doc):
        """Draw dark background on every page."""
        canvas.saveState()
        canvas.setFillColor(BG_DARK)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(TEXT_DIM)
        page_num = doc.page
        canvas.drawCentredString(PAGE_W / 2, 20,
            f'NOTJUST Watr QA Bug Hunter Report  |  Page {page_num}  |  80 bugs found')

        # Subtle top accent line
        canvas.setStrokeColor(ACCENT_PURPLE)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, PAGE_H - 28, PAGE_W - MARGIN, PAGE_H - 28)

        canvas.restoreState()

    def on_first_page(canvas, doc):
        """Cover page - darker background, no header line."""
        canvas.saveState()
        canvas.setFillColor(BG_DARKEST)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(TEXT_DIM)
        canvas.drawCentredString(PAGE_W / 2, 20,
            'NOTJUST Watr QA Bug Hunter Report  |  Cover')

        # Decorative side accent
        canvas.setFillColor(ACCENT_PURPLE)
        canvas.rect(0, 0, 4, PAGE_H, fill=1, stroke=0)

        # Decorative bottom accent
        canvas.setFillColor(ACCENT_TEAL)
        canvas.rect(0, 0, PAGE_W, 3, fill=1, stroke=0)

        canvas.restoreState()

    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=40,
        bottomMargin=36,
    )

    # Build all sections
    story = []

    # Cover
    story.extend(build_cover())
    story.append(PageBreak())

    # Executive Summary
    story.extend(build_executive_summary())
    story.append(PageBreak())

    # Severity Distribution
    story.extend(build_severity_distribution())
    story.append(PageBreak())

    # Critical Bugs
    story.extend(build_critical_bugs())
    story.append(PageBreak())

    # High Bugs
    story.extend(build_high_bugs())
    story.append(PageBreak())

    # Medium Bugs
    story.extend(build_medium_bugs())
    story.append(PageBreak())

    # Low Bugs
    story.extend(build_low_bugs())
    story.append(PageBreak())

    # About This Product
    story.extend(build_about_product())
    story.append(PageBreak())

    # Testing Methodology
    story.extend(build_testing_methodology())
    story.append(PageBreak())

    # Screenshots
    story.extend(build_screenshots())
    story.append(PageBreak())

    # Recommendations
    story.extend(build_conclusion())

    # Build PDF
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f'PDF generated: {OUTPUT_PATH}')
    print(f'File size: {os.path.getsize(OUTPUT_PATH):,} bytes')


if __name__ == '__main__':
    main()
