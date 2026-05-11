from typing import Optional, List, Dict, Any, Callable
import re
import uuid
import time
import json
import requests

from services.account_service import get_accounts_by_user_id
from services.selection_store import cleanup_expired_sessions, get_session, save_session


OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
ACCOUNT_STATUS_TERMS = [
    "account status",
    "status of my account",
    "check my account",
    "my account status",
    "account details",
]


def is_account_status_intent(question: str) -> bool:
    lowered = question.lower()
    return any(term in lowered for term in ACCOUNT_STATUS_TERMS)


def extract_user_id(question: str, explicit_user_id: Optional[str]) -> Optional[str]:
    if explicit_user_id and explicit_user_id.strip():
        return explicit_user_id.strip()
    return None


def account_identifier(account: Dict[str, Any]) -> str:
    for key in ["accountNumber", "accountId", "id", "applicationId"]:
        value = account.get(key)
        if value:
            return str(value)
    return "unknown"


def mask_account_number(value: str) -> str:
    if len(value) <= 4:
        return value
    return f"{'*' * (len(value) - 4)}{value[-4:]}"


def llm_text(model_name: str, instruction: str, facts: Dict[str, Any]) -> str:
    prompt = (
        "You are a banking assistant. Use only the provided facts. "
        "Do not invent fields, IDs, or status values. "
        "If any fact is missing, say that clearly.\n\n"
        f"Task: {instruction}\n"
        f"Facts JSON:\n{json.dumps(facts, ensure_ascii=True)}\n\n"
        "Response style: concise, friendly, and action-oriented."
    )
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
    }
    response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=45)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "I could not generate a response at the moment.").strip()


def selection_options(accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    options = []
    for index, account in enumerate(accounts, start=1):
        account_id = account_identifier(account)
        options.append({
            "selection_id": account_id,
            "index": index,
            "bank_name": account.get("bankName", "Unknown Bank"),
            "account_number_masked": mask_account_number(str(account.get("accountNumber", account_id))),
            "status": account.get("status", "UNKNOWN"),
            "country": account.get("country", ""),
        })
    return options


def _resolve_selected_account_id(accounts: List[Dict[str, Any]], selection_input: str) -> Optional[str]:
    raw = (selection_input or "").strip()
    if not raw:
        return None

    # 1) Numeric selection, e.g. "1"
    if raw.isdigit():
        idx = int(raw)
        if 1 <= idx <= len(accounts):
            return account_identifier(accounts[idx - 1])

    lowered = raw.lower()

    # 2) Exact account identifier match
    for account in accounts:
        account_id = account_identifier(account)
        if lowered == str(account_id).lower():
            return account_id

    # 3) Bank name contains typed text
    bank_matches = []
    for account in accounts:
        bank_name = str(account.get("bankName", "")).lower()
        if lowered and lowered in bank_name:
            bank_matches.append(account)
    if len(bank_matches) == 1:
        return account_identifier(bank_matches[0])

    # 4) Last 4 digits match of account number
    last4 = re.sub(r"\D", "", raw)
    if len(last4) == 4:
        last4_matches = []
        for account in accounts:
            number = re.sub(r"\D", "", str(account.get("accountNumber", "")))
            if number.endswith(last4):
                last4_matches.append(account)
        if len(last4_matches) == 1:
            return account_identifier(last4_matches[0])

    return None


def handle_account_selection(model_name: str, session_id: str, selection_input: str) -> Dict[str, Any]:
    cleanup_expired_sessions()
    session = get_session(session_id)
    if not session:
        response_text = llm_text(
            model_name,
            "Explain that the selection session expired and ask user to request account status again.",
            {"reason": "session_expired"},
        )
        return {"response_type": "final_answer", "response": response_text}

    selected_account_id = _resolve_selected_account_id(session["accounts"], selection_input)
    selected = None
    if selected_account_id:
        for account in session["accounts"]:
            if account_identifier(account) == selected_account_id:
                selected = account
                break

    if not selected:
        options = selection_options(session["accounts"])
        response_text = llm_text(
            model_name,
            "Tell the user selection is invalid and ask to choose using number, bank name, or account last 4 digits.",
            {
                "selection_input": selection_input,
                "valid_options": options,
                "usage": "Reply with 1, 2, 3... or bank name or account last 4 digits.",
            },
        )
        return {
            "response_type": "selection_required",
            "response": response_text,
            "session_id": session_id,
            "options": options,
        }

    latest_accounts = get_accounts_by_user_id(session["user_id"])
    latest_selected = selected
    for account in latest_accounts:
        if account_identifier(account) == selected_account_id:
            latest_selected = account
            break

    response_text = llm_text(
        model_name,
        "Provide the account status details for the selected account and next step if needed.",
        {
            "user_id": session["user_id"],
            "selected_account": latest_selected,
        },
    )
    return {"response_type": "final_answer", "response": response_text}


def orchestrate_query(
    question: str,
    top_k: int,
    model_name: str,
    user_id: Optional[str],
    session_id: Optional[str],
    selected_account_id: Optional[str],
    rag_retriever: Any,
    rag_response_fn: Callable[..., str],
) -> Dict[str, Any]:
    # Only treat session_id as an active selection session if it actually exists
    # in the FastAPI store. Spring Boot sends its own sessionId on every request
    # which must not be mistaken for a FastAPI selection session.
    if session_id and get_session(session_id):
        selection_input = selected_account_id or question
        return handle_account_selection(
            model_name=model_name,
            session_id=session_id,
            selection_input=selection_input,
        )

    if is_account_status_intent(question):
        resolved_user_id = extract_user_id(question, user_id)
        if not resolved_user_id:
            response_text = llm_text(
                model_name,
                "Tell user to sign in before checking account status.",
                {"reason": "authentication_required", "missing": "user_id"},
            )
            return {
                "response_type": "auth_required",
                "response": response_text,
            }

        accounts = get_accounts_by_user_id(resolved_user_id)
        if not accounts:
            response_text = llm_text(
                model_name,
                "Inform user that no accounts were found for the provided user id.",
                {"user_id": resolved_user_id, "accounts_found": 0},
            )
            return {
                "response_type": "final_answer",
                "response": response_text,
            }

        if len(accounts) == 1:
            response_text = llm_text(
                model_name,
                "Provide account status for the single available account.",
                {"user_id": resolved_user_id, "account": accounts[0]},
            )
            return {
                "response_type": "final_answer",
                "response": response_text,
            }

        new_session_id = uuid.uuid4().hex
        save_session(
            new_session_id,
            {
                "user_id": resolved_user_id,
                "accounts": accounts,
                "created_at": time.time(),
            },
        )
        options = selection_options(accounts)
        response_text = llm_text(
            model_name,
            "Ask the user to choose one account from the list to view detailed status.",
            {
                "user_id": resolved_user_id,
                "account_options": options,
                "instruction": "Ask user to reply with option number, bank name, or account last 4 digits.",
            },
        )
        return {
            "response_type": "selection_required",
            "response": response_text,
            "session_id": new_session_id,
            "options": options,
        }

    response = rag_response_fn(
        question,
        rag_retriever,
        api_context=None,
        model_name=model_name,
        top_k=top_k,
    )
    return {"response_type": "final_answer", "response": response}
