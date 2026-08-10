from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Color Palette ──────────────────────────────────────────────────────────────
NAVY        = RGBColor(0x0D, 0x1B, 0x3E)   # deep navy – backgrounds
BLUE        = RGBColor(0x1A, 0x5F, 0xC8)   # brand blue – accents / headings
LIGHT_BLUE  = RGBColor(0xD6, 0xE8, 0xFF)   # light blue – section fills
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
DARK_GRAY   = RGBColor(0x2C, 0x2C, 0x2C)
MID_GRAY    = RGBColor(0x55, 0x55, 0x55)
ACCENT      = RGBColor(0x00, 0xC2, 0xCB)   # teal accent

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]   # completely blank layout

# ══════════════════════════════════════════════════════════════════════════════
# Helper utilities
# ══════════════════════════════════════════════════════════════════════════════

def add_rect(slide, l, t, w, h, fill=None, line=None, line_w=None):
    shape = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    shape.line.fill.background()
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill
    else:
        shape.fill.background()
    if line:
        shape.line.color.rgb = line
        if line_w:
            shape.line.width = line_w
    else:
        shape.line.fill.background()
    return shape


def add_text_box(slide, text, l, t, w, h,
                 font_size=18, bold=False, color=WHITE,
                 align=PP_ALIGN.LEFT, italic=False, wrap=True):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    txb.word_wrap = wrap
    tf = txb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return txb


def add_para(tf, text, font_size=14, bold=False, color=DARK_GRAY,
             align=PP_ALIGN.LEFT, space_before=0, italic=False, bullet=False):
    p = tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    if bullet:
        p.level = 1
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return p


def navy_slide(title_text, subtitle_text=""):
    """Dark navy title/section slide."""
    slide = prs.slides.add_slide(BLANK)
    # full background
    add_rect(slide, 0, 0, 13.33, 7.5, fill=NAVY)
    # accent bar bottom
    add_rect(slide, 0, 6.8, 13.33, 0.7, fill=BLUE)
    # teal left stripe
    add_rect(slide, 0, 0, 0.18, 7.5, fill=ACCENT)
    # title
    add_text_box(slide, title_text, 0.4, 2.6, 12.5, 1.4,
                 font_size=42, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    if subtitle_text:
        add_text_box(slide, subtitle_text, 0.4, 4.1, 12.5, 0.8,
                     font_size=20, color=ACCENT, align=PP_ALIGN.CENTER)
    return slide


def content_slide(heading, bg=WHITE):
    """White content slide with blue header bar."""
    slide = prs.slides.add_slide(BLANK)
    add_rect(slide, 0, 0, 13.33, 7.5, fill=bg)
    # header band
    add_rect(slide, 0, 0, 13.33, 1.05, fill=NAVY)
    # teal left stripe
    add_rect(slide, 0, 0, 0.18, 7.5, fill=ACCENT)
    # heading text
    add_text_box(slide, heading, 0.35, 0.1, 12.5, 0.85,
                 font_size=26, bold=True, color=WHITE, align=PP_ALIGN.LEFT)
    return slide


def bullet_box(slide, items, l, t, w, h, font_size=14, color=DARK_GRAY,
               bullet_char="▸ ", header=None, header_color=BLUE):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    txb.word_wrap = True
    tf = txb.text_frame
    tf.word_wrap = True
    first = True
    if header:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = header
        r.font.size = Pt(font_size + 1)
        r.font.bold = True
        r.font.color.rgb = header_color
        r.font.name = "Calibri"
    for item in items:
        p = tf.paragraphs[0] if (first and not header) else tf.add_paragraph()
        first = False
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = bullet_char + item
        r.font.size = Pt(font_size)
        r.font.color.rgb = color
        r.font.name = "Calibri"
    return txb


def card(slide, l, t, w, h, title, body_lines,
         title_bg=BLUE, title_color=WHITE, body_bg=LIGHT_BLUE, font_size=12):
    """Coloured card with a title band + body text."""
    add_rect(slide, l, t, w, 0.42, fill=title_bg)
    add_text_box(slide, title, l + 0.08, t + 0.04, w - 0.1, 0.36,
                 font_size=13, bold=True, color=title_color)
    add_rect(slide, l, t + 0.42, w, h - 0.42, fill=body_bg)
    txb = slide.shapes.add_textbox(
        Inches(l + 0.1), Inches(t + 0.5), Inches(w - 0.2), Inches(h - 0.55))
    txb.word_wrap = True
    tf = txb.text_frame
    tf.word_wrap = True
    first = True
    for line in body_lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        r = p.add_run()
        r.text = line
        r.font.size = Pt(font_size)
        r.font.color.rgb = DARK_GRAY
        r.font.name = "Calibri"


def table_slide(slide, headers, rows, l, t, w, h):
    """Simple styled table."""
    cols = len(headers)
    tbl = slide.shapes.add_table(len(rows) + 1, cols,
                                  Inches(l), Inches(t),
                                  Inches(w), Inches(h)).table
    col_w = Inches(w / cols)
    for c in tbl.columns:
        c.width = col_w

    # header row
    for ci, hdr in enumerate(headers):
        cell = tbl.cell(0, ci)
        cell.text = hdr
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.runs[0]
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(13)
        run.font.name = "Calibri"

    # data rows
    for ri, row in enumerate(rows):
        bg = LIGHT_BLUE if ri % 2 == 0 else WHITE
        for ci, val in enumerate(row):
            cell = tbl.cell(ri + 1, ci)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.runs[0]
            run.font.color.rgb = DARK_GRAY
            run.font.size = Pt(12)
            run.font.name = "Calibri"


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — Title
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, 13.33, 7.5, fill=NAVY)
add_rect(slide, 0, 0, 0.25, 7.5, fill=ACCENT)
add_rect(slide, 0, 6.0, 13.33, 1.5, fill=BLUE)
# decorative circle
circ = slide.shapes.add_shape(9, Inches(9.5), Inches(0.3), Inches(3.5), Inches(3.5))
circ.fill.solid(); circ.fill.fore_color.rgb = RGBColor(0x1A, 0x3A, 0x6E)
circ.line.fill.background()

add_text_box(slide, "InterBanking Hub", 0.5, 1.5, 9, 1.5,
             font_size=52, bold=True, color=WHITE)
add_text_box(slide, "Full-Stack Multi-Country Banking Platform", 0.5, 3.1, 10, 0.8,
             font_size=22, color=ACCENT)
add_text_box(slide, "React 18  ·  Spring Boot 3  ·  FastAPI  ·  AI RAG Chatbot  ·  JWT Security",
             0.5, 4.0, 12, 0.6, font_size=14, color=RGBColor(0xAA, 0xC8, 0xFF))
add_text_box(slide, "Banking Application  |  2026", 0.5, 6.15, 12, 0.6,
             font_size=13, color=WHITE, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — Project Overview
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Project Overview")
add_text_box(slide, "What is InterBanking Hub?", 0.35, 1.2, 12.5, 0.5,
             font_size=18, bold=True, color=NAVY)
add_text_box(slide,
    "A full-stack web-based banking platform that simulates a real-world bank account management system. "
    "It supports multi-country account applications, document management, admin approval workflows, "
    "and an AI-powered chatbot assistant — all secured with JWT authentication.",
    0.35, 1.75, 12.5, 1.0, font_size=14, color=DARK_GRAY, wrap=True)

cards_data = [
    ("🌍  Countries", ["India", "USA", "United Kingdom"]),
    ("👥  User Roles", ["End User (Customer)", "Branch Admin", "Root Admin"]),
    ("🔧  Core Tech", ["React 18 + Vite", "Spring Boot 3", "FastAPI + Ollama"]),
    ("🔒  Security", ["JWT HS256", "BCrypt passwords", "Role-based access"]),
]
positions = [(0.35, 3.0), (3.55, 3.0), (6.75, 3.0), (9.95, 3.0)]
for (title, lines), (cl, ct) in zip(cards_data, positions):
    card(slide, cl, ct, 3.0, 3.8, title, lines, font_size=13)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — Technology Stack
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Technology Stack")
headers = ["Layer", "Technology", "Details"]
rows = [
    ["Frontend",         "React 18 + Vite",        "SPA, CSS Modules, port 5173"],
    ["Backend Services", "Spring Boot 3 (Java 17)", "6 independent microservices"],
    ["AI Chatbot API",   "FastAPI (Python)",        "LangChain + FAISS + Ollama"],
    ["LLM",             "llama3.2:3b via Ollama",   "Runs locally — no cloud API"],
    ["Vector Store",     "FAISS",                   "Local embeddings, text chunks"],
    ["Databases",        "MySQL",                   "One DB per service (isolated)"],
    ["Authentication",   "JWT HS256",                "24 h expiry, BCrypt passwords"],
    ["Email",            "Gmail SMTP",               "Registration & admin alerts"],
    ["Chatbot Proxy",    "Spring Boot",              "Port 8086 → FastAPI port 8000"],
]
table_slide(slide, headers, rows, 0.35, 1.2, 12.6, 5.8)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — System Architecture
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("System Architecture")

# Frontend box
add_rect(slide, 3.4, 1.15, 6.5, 0.75, fill=BLUE)
add_text_box(slide, "React Frontend   (port 5173)", 3.5, 1.2, 6.3, 0.6,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# Arrow down
add_text_box(slide, "REST  /  Bearer JWT", 5.5, 2.0, 2.3, 0.35,
             font_size=10, color=MID_GRAY, align=PP_ALIGN.CENTER)
add_rect(slide, 6.56, 1.9, 0.06, 0.65, fill=MID_GRAY)

# Middle row services
svc_row = [
    ("User Svc\n8081", 0.35),
    ("Account Svc\n8085", 2.55),
    ("Bank Svc\n8082", 4.75),
    ("Admin Svc\n8083", 6.95),
    ("Root Admin\n8084", 9.15),
]
for label, lpos in svc_row:
    add_rect(slide, lpos, 2.6, 1.9, 0.95, fill=NAVY)
    add_text_box(slide, label, lpos + 0.05, 2.65, 1.8, 0.85,
                 font_size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# Chatbot proxy
add_rect(slide, 9.15, 3.85, 1.9, 0.75, fill=RGBColor(0x2A, 0x70, 0xD0))
add_text_box(slide, "Chatbot Proxy\n8086", 9.2, 3.88, 1.8, 0.65,
             font_size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# FastAPI box
add_rect(slide, 8.8, 5.0, 2.6, 0.85, fill=ACCENT)
add_text_box(slide, "FastAPI RAG API  (port 8000)\nOllama llama3.2:3b  ·  FAISS",
             8.85, 5.05, 2.5, 0.75, font_size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# MySQL boxes
db_x = [0.35, 2.55, 4.75, 6.95]
db_labels = ["userdb", "accountdb", "bankdb", "admindb"]
for lx, lb in zip(db_x, db_labels):
    add_rect(slide, lx + 0.25, 3.85, 1.4, 0.55, fill=LIGHT_BLUE)
    add_text_box(slide, "MySQL\n" + lb, lx + 0.27, 3.87, 1.36, 0.5,
                 font_size=9, color=NAVY, align=PP_ALIGN.CENTER)

add_text_box(slide, "Each service has its own isolated MySQL database  (Database-per-Service Pattern)",
             0.35, 4.7, 12.5, 0.4, font_size=11, italic=True, color=MID_GRAY, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — Microservices — Part 1
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Microservices  —  Core Services")

services = [
    ("User Service  (8081)",
     ["User registration, login, logout, profile update, password change",
      "Issues JWT (HS256, 24 h) with userId claim on login",
      "Spring Security stateless — only /register & /login are public",
      "Server-side token blacklist via SessionService",
      "Gmail SMTP welcome email on registration"]),
    ("Account Service  (8085)",
     ["Full account application lifecycle: PENDING → APPROVED / REJECTED",
      "Strategy Pattern: IndiaAccountStrategy, UsaAccountStrategy, UkAccountStrategy",
      "Accepts multipart form + 4 required documents per application",
      "Admin email alert on every new application",
      "Document storage & download endpoints"]),
    ("Bank Service  (8082)",
     ["Bank directory: country, city, bank name, branch, IFSC / bank code",
      "Filter endpoints by country, city, or both",
      "Single & bulk add, validation-only endpoint",
      "Bank code uniqueness check"]),
]

tops = [1.15, 3.0, 5.1]
for (title, bullets), ty in zip(services, tops):
    add_rect(slide, 0.35, ty, 12.6, 0.38, fill=BLUE)
    add_text_box(slide, title, 0.45, ty + 0.03, 12.3, 0.33,
                 font_size=13, bold=True, color=WHITE)
    bullet_box(slide, bullets, 0.5, ty + 0.42, 12.2,
               1.4 if ty < 5 else 1.0, font_size=12, color=DARK_GRAY)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — Microservices — Part 2
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Microservices  —  Admin & Chatbot Services")

services2 = [
    ("Admin Service  (8083)",
     ["Branch-level admin registration & JWT login",
      "Approve / reject user account applications",
      "New admin accounts are PENDING until Root Admin activates them",
      "Role-based protection: @PreAuthorize(\"hasRole('ROOT_ADMIN')\") on sensitive endpoints"]),
    ("Root Admin Service  (8084)",
     ["Top-level super-admin — highest authority in the hierarchy",
      "Signs in with dedicated service → receives JWT with ROOT_ADMIN role",
      "Verifies and activates pending branch admin accounts",
      "Creates three-tier hierarchy: Root Admin → Branch Admin → End User"]),
    ("RAG Chatbot Service  (8086)",
     ["Spring Boot proxy: forwards /chat requests to Python FastAPI",
      "Decouples the React frontend from the Python runtime",
      "Handles CORS and authentication pass-through"]),
]

tops2 = [1.15, 2.9, 4.85]
for (title, bullets), ty in zip(services2, tops2):
    add_rect(slide, 0.35, ty, 12.6, 0.38, fill=NAVY)
    add_text_box(slide, title, 0.45, ty + 0.03, 12.3, 0.33,
                 font_size=13, bold=True, color=WHITE)
    bullet_box(slide, bullets, 0.5, ty + 0.42, 12.2, 1.4, font_size=12, color=DARK_GRAY)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — AI RAG Chatbot
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("AI RAG Chatbot")

add_rect(slide, 0.35, 1.15, 5.8, 5.6, fill=LIGHT_BLUE)
add_rect(slide, 6.35, 1.15, 6.6, 5.6, fill=RGBColor(0xF0, 0xF8, 0xFF))

add_text_box(slide, "How It Works", 0.5, 1.2, 5.5, 0.4,
             font_size=14, bold=True, color=NAVY)
steps = [
    "1  User sends a question via chat UI",
    "2  FAQ cache checked first (fast path)",
    "3  If no FAQ hit → FAISS vector search",
    "      Retrieves top-K relevant text chunks",
    "4  Context + question → Ollama LLM",
    "5  llama3.2:3b generates natural language answer",
    "6  Response returned to user",
]
bullet_box(slide, steps, 0.45, 1.65, 5.6, 4.5,
           font_size=12, color=DARK_GRAY, bullet_char="")

add_text_box(slide, "Live API Actions  (beyond Q&A)", 6.5, 1.2, 6.2, 0.4,
             font_size=14, bold=True, color=NAVY)
actions = [
    "Look up user accounts & application status",
    "Filter banks by country / city",
    "Update user profile details",
    "Change user or admin password",
    "Multi-turn session memory per user",
    "Supports both user and admin modes",
]
bullet_box(slide, actions, 6.5, 1.65, 6.1, 3.0, font_size=12, color=DARK_GRAY)

add_rect(slide, 6.35, 4.85, 6.6, 1.9, fill=NAVY)
add_text_box(slide, "Stack", 6.5, 4.9, 6.3, 0.35,
             font_size=13, bold=True, color=ACCENT)
stack_items = ["FastAPI (Python)  ·  LangChain  ·  FAISS",
               "Ollama  llama3.2:3b  (local — no cloud API)",
               "Knowledge base: text files in data/text_files/"]
bullet_box(slide, stack_items, 6.5, 5.28, 6.1, 1.4,
           font_size=12, color=WHITE, bullet_char="• ")

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — Frontend Pages
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Frontend Pages & Features")

headers = ["Page", "Description"]
rows = [
    ["HomePage",       "Landing page — hero section, platform overview, call-to-action"],
    ["SignUp",         "User registration form with validation"],
    ["SignIn",         "Login → backend returns JWT → stored in localStorage"],
    ["UserPage",       "Customer dashboard: view profile, accounts, application status"],
    ["CreateAccount",  "6-step multi-country account application wizard"],
    ["BrowseBank",     "Browse and filter banks by country and city"],
    ["AdminPage",      "Admin dashboard: manage applications, accounts, users"],
    ["AboutPage",      "Company / project information"],
]
table_slide(slide, headers, rows, 0.35, 1.2, 12.6, 5.8)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — CreateAccount Wizard
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("CreateAccount — 6-Step Wizard")

steps_labels = ["1\nPersonal\nDetails", "2\nEducational\nDetails",
                "3\nIncome\nDetails", "4\nNominee\nDetails",
                "5\nDocument\nUpload", "6\nReview &\nSubmit"]
step_colors = [BLUE, BLUE, BLUE, BLUE, RGBColor(0x0A, 0x8A, 0x5F), NAVY]
for i, (lbl, col) in enumerate(zip(steps_labels, step_colors)):
    lx = 0.3 + i * 2.12
    add_rect(slide, lx, 1.15, 1.85, 1.2, fill=col)
    add_text_box(slide, lbl, lx + 0.05, 1.18, 1.75, 1.15,
                 font_size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    if i < 5:
        add_text_box(slide, "▶", lx + 1.85, 1.55, 0.25, 0.4,
                     font_size=14, color=NAVY, align=PP_ALIGN.CENTER)

left_bullets = [
    "Country-adaptive fields:",
    "  India  →  PAN (10 alphanum) + Aadhaar (12 digits)",
    "  USA    →  SSN (auto-formatted XXX-XX-XXXX)",
    "  UK     →  NIN (9 alphanumeric)",
    "",
    "Account types per country:",
    "  India  →  Savings, Current, Salary, Fixed Deposit",
    "  USA    →  Checking, Money Market, CD",
    "  UK     →  ISA, Fixed Term",
]
right_bullets = [
    "Real-time blur-triggered field validation",
    "Name fields: letters + spaces only (max 30)",
    "Institution / Course / Occupation: no digits",
    "Mobile / Phone: digits only (max 15)",
    "Amount fields: digits only, upper bound enforced",
    "SSN: auto-formatted as XXX-XX-XXXX",
    "4 required document uploads per application",
    "Progress auto-saved to localStorage",
    "RFC-compliant email validation",
]
bullet_box(slide, left_bullets, 0.35, 2.5, 6.3, 4.5, font_size=12, color=DARK_GRAY)
bullet_box(slide, right_bullets, 6.85, 2.5, 6.1, 4.5, font_size=12, color=DARK_GRAY)
add_rect(slide, 6.7, 2.45, 0.04, 4.6, fill=LIGHT_BLUE)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — Security Architecture
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Security Architecture")

sec_items = [
    ("JWT (HS256)",
     "Issued on login · 24-hour expiry · includes userId claim · secret key configured in application.yml"),
    ("Bearer Token Flow",
     "Every API call sends Authorization: Bearer <token> · userApi.js injects header automatically"),
    ("Spring Security",
     "Stateless session policy · JwtAuthenticationFilter on each service · validates signature & expiry"),
    ("Token Blacklist",
     "SessionService tracks revoked tokens · logout endpoint invalidates server-side immediately"),
    ("BCrypt Passwords",
     "All passwords stored as BCrypt hashes — never plain text"),
    ("Role-Based Access",
     "@PreAuthorize('hasRole(ROOT_ADMIN)') guards admin verification endpoints"),
    ("Frontend Guard",
     "authGuard.js checks token presence + user object validity · auto-redirects to /signin on 401/403"),
    ("CORS",
     "Each service explicitly allows localhost:5173 · credentials: true for cookie/auth support"),
]

col1 = sec_items[:4]
col2 = sec_items[4:]

for i, (title, body) in enumerate(col1):
    ty = 1.2 + i * 1.48
    add_rect(slide, 0.35, ty, 6.1, 0.36, fill=NAVY)
    add_text_box(slide, title, 0.45, ty + 0.03, 5.9, 0.3, font_size=12, bold=True, color=WHITE)
    add_rect(slide, 0.35, ty + 0.36, 6.1, 0.98, fill=LIGHT_BLUE)
    add_text_box(slide, body, 0.48, ty + 0.4, 5.9, 0.9, font_size=11, color=DARK_GRAY)

for i, (title, body) in enumerate(col2):
    ty = 1.2 + i * 1.48
    add_rect(slide, 6.85, ty, 6.1, 0.36, fill=BLUE)
    add_text_box(slide, title, 6.95, ty + 0.03, 5.9, 0.3, font_size=12, bold=True, color=WHITE)
    add_rect(slide, 6.85, ty + 0.36, 6.1, 0.98, fill=LIGHT_BLUE)
    add_text_box(slide, body, 6.98, ty + 0.4, 5.9, 0.9, font_size=11, color=DARK_GRAY)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — Design Patterns
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Key Design Patterns")

patterns = [
    ("Strategy Pattern",    "Country-specific account creation\n(IndiaAccountStrategy, UsaAccountStrategy, UkAccountStrategy)"),
    ("Repository Pattern",  "All data access via Spring Data JPA repositories\n(AccountRepository, UserRepository, BankRepository…)"),
    ("DTO Pattern",         "Request/Response objects separate from JPA entities\n(AccountRequest, LoginResponse, UserDetailsResponse…)"),
    ("Filter Chain",        "JWT authentication via Spring Security filter\n(JwtAuthenticationFilter on each secured service)"),
    ("Proxy Pattern",       "RAG Chatbot Service proxies requests to FastAPI\n(Spring Boot → Python, decoupled runtimes)"),
    ("RAG Pattern",         "Retrieval-Augmented Generation for chatbot\n(FAISS retrieval + Ollama LLM generation)"),
    ("Guard Pattern",       "Frontend route protection via authGuard.js\n(token check + 401/403 redirect)"),
    ("Session Store",       "Per-user chatbot session state in SelectionStore\n(multi-turn conversation memory)"),
]

cols = 4
for i, (name, desc) in enumerate(patterns):
    row = i // cols
    col = i % cols
    lx = 0.35 + col * 3.24
    ty = 1.2 + row * 2.7
    add_rect(slide, lx, ty, 3.0, 0.45, fill=NAVY if row == 0 else BLUE)
    add_text_box(slide, name, lx + 0.08, ty + 0.05, 2.85, 0.37,
                 font_size=12, bold=True, color=WHITE)
    add_rect(slide, lx, ty + 0.45, 3.0, 1.95, fill=LIGHT_BLUE)
    add_text_box(slide, desc, lx + 0.1, ty + 0.52, 2.82, 1.8,
                 font_size=11, color=DARK_GRAY)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — Service Port Reference & Databases
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("Service Reference — Ports & Databases")

add_text_box(slide, "Service Port Map", 0.35, 1.2, 6.1, 0.4,
             font_size=15, bold=True, color=NAVY)
svc_table_headers = ["Service", "Port", "Database"]
svc_rows = [
    ["User Service",              "8081", "userdb"],
    ["Bank Service",              "8082", "bankdb"],
    ["Admin Service",             "8083", "admindb"],
    ["Root Admin Service",        "8084", "rootadmindb"],
    ["Account Service",           "8085", "accountdb"],
    ["RAG Chatbot Service (proxy)","8086", "—"],
    ["FastAPI RAG API",           "8000", "— (FAISS local)"],
    ["React Frontend",            "5173", "—"],
]
table_slide(slide, svc_table_headers, svc_rows, 0.35, 1.7, 6.1, 5.3)

add_text_box(slide, "Account Types by Country", 6.85, 1.2, 6.0, 0.4,
             font_size=15, bold=True, color=NAVY)
acc_headers = ["Country", "Account Types"]
acc_rows = [
    ["India", "Savings, Current, Salary, Fixed Deposit"],
    ["USA",   "Checking, Money Market, Certificate of Deposit"],
    ["UK",    "ISA, Fixed Term"],
]
table_slide(slide, acc_headers, acc_rows, 6.85, 1.7, 6.1, 2.2)

add_text_box(slide, "User Hierarchy", 6.85, 4.15, 6.0, 0.4,
             font_size=15, bold=True, color=NAVY)
add_rect(slide, 6.85, 4.6, 6.1, 2.4, fill=LIGHT_BLUE)
hierarchy = [
    "Root Admin",
    "   └─ Branch Admin  (verified by Root Admin)",
    "         └─ End User  (applications reviewed by Admin)",
]
txb = slide.shapes.add_textbox(Inches(7.0), Inches(4.75), Inches(5.8), Inches(2.1))
txb.word_wrap = True
tf = txb.text_frame
tf.word_wrap = True
for i, line in enumerate(hierarchy):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    r = p.add_run()
    r.text = line
    r.font.size = Pt(13)
    r.font.bold = (i == 0)
    r.font.color.rgb = NAVY if i == 0 else DARK_GRAY
    r.font.name = "Calibri"

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 13 — End-to-End Data Flow
# ══════════════════════════════════════════════════════════════════════════════
slide = content_slide("End-to-End Application Flow")

flow_steps = [
    ("1", "User Registers",        "user-service creates account,\nsends welcome email via Gmail SMTP"),
    ("2", "User Logs In",          "Receives JWT token,\nstored in localStorage"),
    ("3", "Browse Banks",          "bank-service returns country/city\nfiltered bank directory"),
    ("4", "Create Account",        "6-step wizard + 4 document uploads\nsubmitted to account-service"),
    ("5", "Admin Reviews",         "Admin approves / rejects application\naccount-service updates status"),
    ("6", "User Checks Status",    "UserPage fetches live status\nfrom account-service"),
    ("7", "RAG Chatbot Assist",    "Answers questions & performs\nlive API lookups anytime"),
]

row_h = 0.78
for i, (num, title, desc) in enumerate(flow_steps):
    ty = 1.15 + i * row_h
    # number circle
    add_rect(slide, 0.35, ty + 0.08, 0.55, 0.55, fill=BLUE)
    add_text_box(slide, num, 0.36, ty + 0.1, 0.53, 0.48,
                 font_size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    # title
    add_rect(slide, 1.05, ty + 0.08, 3.5, 0.55, fill=NAVY)
    add_text_box(slide, title, 1.1, ty + 0.1, 3.4, 0.5,
                 font_size=13, bold=True, color=WHITE)
    # description
    add_rect(slide, 4.65, ty + 0.08, 8.3, 0.55, fill=LIGHT_BLUE)
    add_text_box(slide, desc, 4.75, ty + 0.1, 8.1, 0.5, font_size=11, color=DARK_GRAY)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 14 — Summary / Key Highlights
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, 13.33, 7.5, fill=NAVY)
add_rect(slide, 0, 0, 0.18, 7.5, fill=ACCENT)
add_rect(slide, 0, 6.8, 13.33, 0.7, fill=BLUE)

add_text_box(slide, "Key Highlights", 0.4, 0.2, 12.5, 0.7,
             font_size=30, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

highlights = [
    ("🌍", "Multi-Country Support",     "India, USA, UK — country-specific fields, account types, and document requirements"),
    ("⚙️", "Microservices",             "6 independent Spring Boot services, each with its own MySQL database"),
    ("🤖", "AI-Powered Chatbot",        "Local RAG using FAISS + Ollama — no cloud AI needed, real-time API actions"),
    ("🔒", "End-to-End JWT Security",   "Stateless, role-based, BCrypt passwords, server-side logout blacklist"),
    ("✅", "Production-Grade Validation","Blur-triggered, field-level — enforced on both client and server"),
    ("📄", "Document Management",       "Multipart upload/download for 4 required documents per application"),
    ("👑", "Three-Tier Admin Hierarchy","End User → Branch Admin → Root Admin"),
    ("🧩", "Clean Design Patterns",     "Strategy, Repository, DTO, Filter Chain, RAG, Guard, Proxy"),
]

cols = 2
for i, (icon, title, body) in enumerate(highlights):
    row = i // cols
    col = i % cols
    lx = 0.4 + col * 6.4
    ty = 1.05 + row * 1.35
    add_rect(slide, lx, ty, 6.1, 1.2, fill=RGBColor(0x0D, 0x2A, 0x5E))
    add_text_box(slide, icon + "  " + title, lx + 0.12, ty + 0.07, 5.85, 0.42,
                 font_size=13, bold=True, color=ACCENT)
    add_text_box(slide, body, lx + 0.12, ty + 0.53, 5.85, 0.6,
                 font_size=11, color=RGBColor(0xCC, 0xDD, 0xFF))

add_text_box(slide, "InterBanking Hub  |  2026  |  Built with React · Spring Boot · FastAPI · Ollama",
             0.4, 6.88, 12.5, 0.4, font_size=11, color=WHITE, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# Save
# ══════════════════════════════════════════════════════════════════════════════
output_path = r"C:\Users\PI20587195\OneDrive - Wipro\Documents\banking-application\InterBanking_Hub_Presentation.pptx"
prs.save(output_path)
print(f"Saved: {output_path}")
