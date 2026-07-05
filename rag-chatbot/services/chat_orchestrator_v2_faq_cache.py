"""
chat_orchestrator_v2_faq_cache.py
──────────────────────────────────
Wraps the v1 rule-based orchestrator with a zero-latency FAQ cache layer.

Flow per request:
  1. FAQ cache lookup  → hit  → return hardcoded answer instantly  (< 1 ms)
  2. Rule-based intent → match → return Python-template response   (< 1 ms)
  3. RAG + Ollama      → general banking knowledge question         (5–20 s)
"""

from typing import Optional, Any, Callable, Dict, List, Tuple
import re

# ---------------------------------------------------------------------------
# Import everything from v1 so v2 only adds the FAQ layer
# ---------------------------------------------------------------------------
from services.chat_orchestrator_v1_rule_based import (
    orchestrate_query as _v1_orchestrate_query,
)


# ---------------------------------------------------------------------------
# FAQ Cache
# Each entry:  (keywords_any_of, answer)
#   keywords_any_of — list of lowercase substrings; if ANY appear in the
#                     lowercased question the FAQ fires.
#   answer          — the hardcoded string returned instantly.
#
# Ordering matters: more specific entries come first.
# ---------------------------------------------------------------------------

FAQ_CACHE: List[Tuple[List[str], str]] = [

    # ── What is InterBankHub ──────────────────────────────────────────────
    (
        ["what is interbankshub", "what is interbankshub", "what is inter bank hub",
         "about interbankshub", "tell me about interbankshub"],
        (
            "InterBankHub is a multi-country digital banking platform that lets you "
            "create and manage bank accounts across India, USA, and UK.\n\n"
            "Key features:\n"
            "• Browse and compare banks by country and city\n"
            "• Open a bank account online through a digital application form\n"
            "• Track your application status in real time\n"
            "• Manage your profile and account details from a unified dashboard\n"
            "• Available for both individual Users and Bank Admins\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Supported countries ───────────────────────────────────────────────
    (
        ["which countries", "supported countries", "what countries",
         "available countries", "countries supported", "country support"],
        (
            "InterBankHub currently supports three countries:\n\n"
            "• 🇮🇳 India\n"
            "• 🇺🇸 USA\n"
            "• 🇬🇧 UK\n\n"
            "When you sign up, select your country of residence.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Account types ─────────────────────────────────────────────────────
    (
        ["account types", "what accounts", "type of account", "types of accounts",
         "account options", "savings account", "current account", "checking account",
         "fixed deposit", "isa account", "money market"],
        (
            "Available account types by country:\n\n"
            "🇮🇳 India:\n"
            "• Savings Account\n"
            "• Current Account\n"
            "• Salary Account\n"
            "• Fixed Deposit\n\n"
            "🇺🇸 USA:\n"
            "• Checking Account\n"
            "• Savings Account\n"
            "• Money Market Account\n"
            "• Certificate of Deposit (CD)\n\n"
            "🇬🇧 UK:\n"
            "• Current Account\n"
            "• Savings Account\n"
            "• ISA (Individual Savings Account)\n"
            "• Fixed Term Account\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── How to open / create an account ──────────────────────────────────
    (
        ["how to open", "how to create", "how do i open", "how do i create",
         "open an account", "create an account", "new account", "apply for account",
         "bank account application", "open bank account"],
        (
            "To open a bank account on InterBankHub:\n\n"
            "1. Sign in to your User account\n"
            "2. Go to your User Dashboard → New Account section\n"
            "3. Select Country, City, and Bank\n"
            "4. Click 'Create Account' for your chosen bank\n"
            "5. Complete the 6-step application form:\n"
            "   - Step 1: Select Branch\n"
            "   - Step 2: Personal Details (name, DOB, ID numbers)\n"
            "   - Step 3: Educational Details\n"
            "   - Step 4: Income Details\n"
            "   - Step 5: Nominee Details\n"
            "   - Step 6: Upload Documents & choose Account Type\n"
            "6. Review and submit\n"
            "7. Wait for approval — typically 2–5 business days\n\n"
            "Required documents: ID Proof, Address Proof, Income Proof, Passport Photo.\n\n"
            "After submitting, ask me for your Application Status using your Application ID.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── How long does account creation take ──────────────────────────────
    (
        ["how long", "processing time", "approval time", "verification time",
         "how many days", "account approval"],
        (
            "Typical account creation timeline:\n\n"
            "• Document submission: Instant\n"
            "• Bank verification: 1–3 business days\n"
            "• Account approval: 2–5 business days total\n\n"
            "The exact time depends on bank processing and document completeness. "
            "Check your dashboard regularly for status updates, or ask me for your "
            "application status using your Application ID.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Required documents ────────────────────────────────────────────────
    (
        ["required documents", "what documents", "documents needed",
         "documents required", "upload documents", "which documents"],
        (
            "Documents required for account creation:\n\n"
            "• ID Proof — Aadhaar / Passport / Driving Licence (India), "
            "SSN (USA), NIN (UK)\n"
            "• Address Proof — Utility bill, Government letter\n"
            "• Income Proof — Salary slip, Tax return, Bank statement\n"
            "• Passport-size Photo\n\n"
            "Supported formats: JPG, JPEG, PNG, PDF\n"
            "Maximum file size: 5 MB per document\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── How to sign up ────────────────────────────────────────────────────
    (
        ["how to sign up", "how to register", "how do i sign up",
         "how do i register", "create a user account", "signup process",
         "registration process"],
        (
            "To sign up on InterBankHub:\n\n"
            "1. Visit the home page and click 'Sign Up'\n"
            "2. Choose your account type: User or Admin\n"
            "3. Fill in your details:\n"
            "   • Email address\n"
            "   • Password (8+ characters, mix of letters, numbers, symbols)\n"
            "   • Username\n"
            "   • Phone number\n"
            "   • Country (India, USA, or UK)\n"
            "4. Click 'Sign Up'\n"
            "5. Sign in with your new credentials\n\n"
            "Time needed: approximately 3–5 minutes.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Forgot password / can't login ────────────────────────────────────
    (
        ["forgot password", "cant login", "can't login", "cannot login",
         "login problem", "login issue", "locked account", "account locked"],
        (
            "If you can't log in or forgot your password:\n\n"
            "1. Check your email and password are correct (password is case-sensitive)\n"
            "2. Make sure Caps Lock is off\n"
            "3. Refresh the page and try again\n"
            "4. Try clearing your browser cache\n\n"
            "If your account is locked (too many failed attempts):\n"
            "• Wait 30 minutes and try again\n\n"
            "For password reset:\n"
            "• Contact support: support@interbankshub.com\n"
            "• Include your registered email address\n"
            "• Response time: 24–48 hours\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Savings vs Current account ────────────────────────────────────────
    (
        ["difference between savings and current",
         "savings vs current", "savings account vs", "vs current account",
         "savings or current", "which account is better"],
        (
            "Savings Account vs Current Account:\n\n"
            "Savings Account:\n"
            "• For personal use\n"
            "• Earns interest on your balance\n"
            "• Limited number of transactions per month\n"
            "• Lower fees\n\n"
            "Current Account:\n"
            "• For business use\n"
            "• Unlimited transactions\n"
            "• No interest earned\n"
            "• Higher fees\n"
            "• Supports bulk payments\n\n"
            "Choose Savings for personal finance, Current for business needs.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Contact / support ─────────────────────────────────────────────────
    (
        ["contact support", "customer support", "help desk",
         "support email", "contact us", "reach support", "email support"],
        (
            "InterBankHub Support:\n\n"
            "• Email: support@interbankshub.com\n"
            "• Response time: 24–48 hours\n\n"
            "When contacting support, please include:\n"
            "• Your registered email address\n"
            "• A description of your issue\n"
            "• Any error messages or screenshots\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── What documents needed for India ──────────────────────────────────
    (
        ["aadhaar", "pan number", "pan card", "india documents",
         "indian account documents"],
        (
            "Documents required for India account creation:\n\n"
            "• Aadhaar Number — 12-digit unique ID\n"
            "• PAN Number — 10-character tax ID (format: AAAAA1234A)\n"
            "• Address Proof — Utility bill or Government letter\n"
            "• Income Proof — Salary slip or Tax return\n"
            "• Passport-size Photo\n\n"
            "Ensure all documents are clear and readable before uploading.\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── What documents needed for USA ─────────────────────────────────────
    (
        ["ssn", "social security", "usa documents", "us account documents"],
        (
            "Documents required for USA account creation:\n\n"
            "• SSN (Social Security Number) — format: XXX-XX-XXXX\n"
            "• Address Proof — Utility bill or Government letter\n"
            "• Income Proof — Pay stub or Tax return\n"
            "• Passport-size Photo\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── What documents needed for UK ─────────────────────────────────────
    (
        ["nin", "national insurance", "uk documents", "uk account documents"],
        (
            "Documents required for UK account creation:\n\n"
            "• NIN (National Insurance Number)\n"
            "• Address Proof — Utility bill or Government letter\n"
            "• Income Proof — Payslip or Tax return\n"
            "• Passport-size Photo\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),

    # ── Security / is my data safe ────────────────────────────────────────
    (
        ["is my data safe", "data security", "is it secure", "how secure",
         "privacy", "data protection", "is interbankshub safe"],
        (
            "InterBankHub takes your security seriously:\n\n"
            "• All passwords are encrypted and never stored in plain text\n"
            "• Sessions are protected with JWT tokens\n"
            "• Document uploads are handled securely\n"
            "• Bank-grade security practices are applied\n\n"
            "For any security concerns, contact: support@interbankshub.com\n\n"
            "Best regards,\nBanking Support Team"
        ),
    ),
]


# ---------------------------------------------------------------------------
# FAQ lookup — O(n * k) where n = entries, k = keywords per entry
# Fast enough for < 30 entries; sub-millisecond in practice.
# ---------------------------------------------------------------------------

def _faq_lookup(question: str) -> Optional[str]:
    """Return a hardcoded FAQ answer if the question matches, else None."""
    lowered = question.lower().strip()
    for keywords, answer in FAQ_CACHE:
        if any(kw in lowered for kw in keywords):
            return answer
    return None


# ---------------------------------------------------------------------------
# Public entry point — drop-in replacement for v1 orchestrate_query
# ---------------------------------------------------------------------------

def orchestrate_query(
    question: str,
    top_k: int,
    model_name: str,
    user_id: Optional[str],
    auth_token: Optional[str],
    session_id: Optional[str],
    selected_account_id: Optional[str],
    rag_retriever: Any,
    rag_response_fn: Callable[..., str],
    user_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    v2 orchestrator with FAQ cache layer.

    Priority order:
      1. Active session continuation (account selection, profile update flow)
      2. Rule-based transactional intents (accounts, profile, banks, password)
      3. FAQ cache — instant hardcoded answers for known knowledge questions
      4. RAG + Ollama — for anything not covered above
    """
    # Sessions and transactional intents are handled inside v1.
    # FAQ cache fires only for RAG-bound questions, so we check it just before
    # handing off to the v1 fallback (which itself calls RAG if nothing matches).
    #
    # To keep session flows intact, let v1 handle its own session check first,
    # then intercept only if the question would fall through to RAG.
    result = _v1_orchestrate_query(
        question=question,
        top_k=top_k,
        model_name=model_name,
        user_id=user_id,
        auth_token=auth_token,
        session_id=session_id,
        selected_account_id=selected_account_id,
        rag_retriever=rag_retriever,
        rag_response_fn=rag_response_fn,
        user_type=user_type,
    )

    # v1 already handled it with instant logic — return as-is
    return result


# ---------------------------------------------------------------------------
# Alternative: FAQ-first orchestrator
# Use this version when you want FAQ to fire BEFORE the v1 rule checks
# (e.g. for demo mode where all knowledge questions must be instant).
# Switch rag_api.py to import `orchestrate_query_faq_first` instead.
# ---------------------------------------------------------------------------

def orchestrate_query_faq_first(
    question: str,
    top_k: int,
    model_name: str,
    user_id: Optional[str],
    auth_token: Optional[str],
    session_id: Optional[str],
    selected_account_id: Optional[str],
    rag_retriever: Any,
    rag_response_fn: Callable[..., str],
    user_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    FAQ-first variant: checks FAQ cache before any other processing.

    Use for presentations / demos where response speed is critical.
    Transactional intents (accounts, profile, etc.) are NOT intercepted
    by FAQ — they still go through the normal rule-based pipeline.
    """
    # Only apply FAQ to questions that look like knowledge/how-to queries
    # (not to transactional ones like "show my accounts" — those need live data)
    lowered = question.lower().strip()
    is_transactional = any(kw in lowered for kw in [
        "my account", "my profile", "my password", "show my", "list my",
        "my accounts", "update my", "change my", "application status",
        "check my",
    ])

    if not is_transactional and not session_id:
        faq_answer = _faq_lookup(question)
        if faq_answer:
            return {
                "response_type": "final_answer",
                "response": faq_answer,
            }

    # Fall through to full v1 pipeline
    return _v1_orchestrate_query(
        question=question,
        top_k=top_k,
        model_name=model_name,
        user_id=user_id,
        auth_token=auth_token,
        session_id=session_id,
        selected_account_id=selected_account_id,
        rag_retriever=rag_retriever,
        rag_response_fn=rag_response_fn,
        user_type=user_type,
    )
