from typing import Optional, List, Dict, Any, Callable
import os
import re
import uuid
import time
import json
from datetime import datetime
import requests

from services.account_service import (
    get_accounts_by_user_id,
    get_application_status,
    get_account_by_account_number,
)
from services.bank_service import (
    bank_city,
    bank_country,
    bank_name,
    filter_banks_by_city,
    filter_banks_by_country,
    get_all_banks,
    get_banks_by_country,
    get_banks_by_country_and_city,
)
from services.user_service import (
    change_user_password,
    get_user_by_id,
    update_user_details,
)
from services.admin_service import (
    change_admin_password,
    update_admin_details,
)
from services.selection_store import cleanup_expired_sessions, get_session, remove_session, save_session


OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
ACCOUNT_STATUS_TERMS = [
    "account status",
    "status of my account",
    "check my account",
    "my account status",
    "account details",
    "bank status",
    "my bank status",
    "check my bank",
    "status of my bank",
    "check account",
    "view account",
    "see my account",
    "account info",
    "account information",
    "my banking status",
    "my account details",
    "check my bank status",
]

APPLICATION_STATUS_TERMS = [
    "application status",
    "application progress",
    "check my application",
    "track my application",
    "status of my application",
]

LIST_ACCOUNTS_TERMS = [
    "list my accounts",
    "show my accounts",
    "my accounts",
    "list of accounts",
    "show all my accounts",
    "display my accounts",
]

BANK_LOOKUP_TERMS = [
    "available banks",
    "what banks are available",
    "which banks are available",
    "list of banks",
    "banks available",
    "show banks",
    "bank list",
    "find banks",
    "search banks",
    "bank names",
]

COUNTRY_ALIASES = {
    "india": "India",
    "in": "India",
    "usa": "USA",
    "u.s.a": "USA",
    "united states": "USA",
    "uk": "UK",
    "u.k": "UK",
    "united kingdom": "UK",
}

CITY_ALIASES = {
    "hyderabad": "Hyderabad",
    "hyderbad": "Hyderabad",
}

CITY_TO_COUNTRY = {
    "hyderabad": "India",
    "hyderbad": "India",
}

PROFILE_VIEW_TERMS = [
    "show my profile",
    "my profile",
    "view my profile",
    "profile details",
    "who am i",
]

PROFILE_UPDATE_TERMS = [
    "update my profile",
    "change my profile",
    "update my email",
    "change my email",
    "update my phone",
    "change my phone",
    "update my mobile",
    "change my mobile",
    "update my mobile number",
    "change my mobile number",
    "update mobile number",
    "change mobile number",
    "update my username",
    "change my username",
]

PASSWORD_UPDATE_TERMS = [
    "change my password",
    "update my password",
    "reset my password",
]

GREETING_TERMS = {
    "hi", "hello", "hey", "hii", "helo", "heyy",
    "good morning", "good afternoon", "good evening", "good night",
    "howdy", "greetings", "sup",
    "what's up", "whats up", "how are you", "how r u",
}


def _is_how_to_question(question: str) -> bool:
    lowered = question.lower().strip()
    return lowered.startswith("how") or "how to" in lowered or "how do" in lowered or "how can" in lowered


def is_greeting_intent(question: str) -> bool:
    lowered = question.lower().strip().rstrip("!.,? ")
    return lowered in GREETING_TERMS


def is_account_status_intent(question: str) -> bool:
    if _is_how_to_question(question):
        return False
    lowered = question.lower()
    return any(term in lowered for term in ACCOUNT_STATUS_TERMS)


def is_application_status_intent(question: str) -> bool:
    if _is_how_to_question(question):
        return False
    lowered = question.lower()
    return any(term in lowered for term in APPLICATION_STATUS_TERMS)


def is_list_accounts_intent(question: str) -> bool:
    if _is_how_to_question(question):
        return False
    lowered = question.lower()
    return any(term in lowered for term in LIST_ACCOUNTS_TERMS)


def is_bank_lookup_intent(question: str) -> bool:
    if _is_how_to_question(question):
        return False
    lowered = question.lower()
    if any(term in lowered for term in BANK_LOOKUP_TERMS):
        return True
    if "banks in" in lowered or "bank in" in lowered:
        return True
    return lowered.startswith("what banks") or lowered.startswith("show bank") or lowered.startswith("list bank")


def is_profile_view_intent(question: str) -> bool:
    lowered = question.lower()
    return any(term in lowered for term in PROFILE_VIEW_TERMS)


def is_profile_update_intent(question: str) -> bool:
    lowered = question.lower()
    if any(term in lowered for term in PROFILE_UPDATE_TERMS):
        return True

    # Support natural phrasing like "i want change my mobile number"
    has_update_verb = any(token in lowered for token in ["change", "update", "modify"])
    has_profile_field = any(token in lowered for token in ["email", "phone", "mobile", "mobile number", "username", "profile"])
    return has_update_verb and has_profile_field


def is_password_update_intent(question: str) -> bool:
    lowered = question.lower()
    return any(term in lowered for term in PASSWORD_UPDATE_TERMS)


def _clean_value(value: str) -> str:
    return value.strip().strip(".!,;: ").strip('"\'')


def extract_profile_updates(question: str) -> Dict[str, str]:
    lowered = question.lower()
    updates: Dict[str, str] = {}

    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", question)
    if email_match and "email" in lowered:
        updates["email"] = _clean_value(email_match.group(0))

    phone_match = re.search(r"\+?\d[\d\s-]{7,}\d", question)
    if phone_match and ("phone" in lowered or "mobile" in lowered):
        updates["phone"] = re.sub(r"\D", "", phone_match.group(0))

    username_match = re.search(r"(?:username)\s+(?:to|as|is)\s+([A-Za-z0-9_.-]{3,})", question, re.IGNORECASE)
    if username_match:
        updates["username"] = _clean_value(username_match.group(1))

    # Handles patterns like:
    # - "change my email to x"
    # - "i want to change my email to x"
    # - "please update my phone to y"
    for field in ("email", "phone", "username"):
        pattern = rf"(?:please\s+)?(?:i\s+want\s+to\s+)?(?:change|update)\s+(?:my\s+)?{field}\s+(?:to|as|is)\s+([^,\n]+)"
        match = re.search(pattern, question, re.IGNORECASE)
        if match:
            raw_value = _clean_value(match.group(1))
            if field == "phone":
                raw_value = re.sub(r"\D", "", raw_value)
            updates[field] = raw_value

    return {k: v for k, v in updates.items() if v}


def extract_requested_profile_field(question: str) -> Optional[str]:
    lowered = question.lower()
    if "email" in lowered:
        return "email"
    if "phone" in lowered or "mobile" in lowered:
        return "phone"
    if "username" in lowered:
        return "username"
    return None


def extract_value_for_field(field: str, text: str) -> Optional[str]:
    if field == "email":
        match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        return _clean_value(match.group(0)) if match else None

    if field == "phone":
        match = re.search(r"\+?\d[\d\s-]{7,}\d", text)
        if not match:
            return None
        return re.sub(r"\D", "", match.group(0))

    if field == "username":
        explicit = re.search(r"(?:username)\s+(?:to|as|is)\s+([A-Za-z0-9_.-]{3,})", text, re.IGNORECASE)
        if explicit:
            return _clean_value(explicit.group(1))
        token = _clean_value(text)
        if re.fullmatch(r"[A-Za-z0-9_.-]{3,}", token):
            return token
        return None

    return None


def extract_password_payload(question: str) -> Dict[str, str]:
    # One-shot support only; guided multi-turn can be added later if required.
    current_match = re.search(r"current\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)
    new_match = re.search(r"new\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)
    confirm_match = re.search(r"confirm\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)

    payload = {
        "currentPassword": _clean_value(current_match.group(1)) if current_match else "",
        "newPassword": _clean_value(new_match.group(1)) if new_match else "",
        "confirmPassword": _clean_value(confirm_match.group(1)) if confirm_match else "",
    }
    return payload


def extract_admin_password_payload(question: str) -> Dict[str, str]:
    """Extract oldPassword/newPassword for admin password change API."""
    old_match = re.search(r"old\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)
    # Also accept "current password" as alias for "old password"
    current_match = re.search(r"current\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)
    new_match = re.search(r"new\s+password\s*(?:is|:)?\s*([^,\n]+)", question, re.IGNORECASE)

    old_password = ""
    if old_match:
        old_password = _clean_value(old_match.group(1))
    elif current_match:
        old_password = _clean_value(current_match.group(1))

    return {
        "oldPassword": old_password,
        "newPassword": _clean_value(new_match.group(1)) if new_match else "",
    }


def extract_admin_profile_updates(question: str) -> Dict[str, str]:
    """Extract updatable admin fields: username, email, bankname, country."""
    lowered = question.lower()
    updates: Dict[str, str] = {}

    # Reuse user email/username extraction
    user_updates = extract_profile_updates(question)
    if "email" in user_updates:
        updates["email"] = user_updates["email"]
    if "username" in user_updates:
        updates["username"] = user_updates["username"]

    # Bankname
    bankname_match = re.search(
        r"(?:bank\s*name|bankname)\s+(?:to|as|is)\s+([A-Za-z0-9\s&._-]{2,})", question, re.IGNORECASE
    )
    if bankname_match:
        updates["bankname"] = _clean_value(bankname_match.group(1))

    # Country
    country_match = re.search(
        r"country\s+(?:to|as|is)\s+([A-Za-z\s]{2,})", question, re.IGNORECASE
    )
    if country_match:
        updates["country"] = _clean_value(country_match.group(1)).upper()

    return {k: v for k, v in updates.items() if v}


def extract_requested_admin_profile_field(question: str) -> Optional[str]:
    """Detect which admin-specific field the user wants to change (without value)."""
    lowered = question.lower()
    if "email" in lowered:
        return "email"
    if "username" in lowered:
        return "username"
    if "bank name" in lowered or "bankname" in lowered:
        return "bankname"
    if "country" in lowered:
        return "country"
    return None


def extract_value_for_admin_field(field: str, text: str) -> Optional[str]:
    """Extract a value for an admin profile field from a follow-up message."""
    if field == "email":
        return extract_value_for_field("email", text)
    if field == "username":
        return extract_value_for_field("username", text)
    if field == "bankname":
        token = _clean_value(text)
        if token:
            return token
        return None
    if field == "country":
        token = _clean_value(text).upper()
        if token:
            return token
        return None
    return None


def clean_user_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    cleaned = {
        "id": user.get("id") or user.get("userId") or user.get("user_id") or "",
        "username": user.get("username") or user.get("userName") or "",
        "email": user.get("email") or "",
        "phone": user.get("phone") or user.get("phoneNumber") or "",
    }
    return {k: v for k, v in cleaned.items() if v != ""}


def extract_country_from_question(question: str) -> Optional[str]:
    lowered = question.lower()
    for key, value in COUNTRY_ALIASES.items():
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            return value
    return None


def extract_city_from_question(question: str) -> Optional[str]:
    lowered = question.lower()
    for key, value in CITY_ALIASES.items():
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            return value
    return None


def _infer_country_for_city(city: Optional[str]) -> Optional[str]:
    if not city:
        return None
    return CITY_TO_COUNTRY.get(city.lower().strip())


def _format_bank_location(bank: Dict[str, Any]) -> str:
    parts = []
    city = bank_city(bank)
    country = bank_country(bank)
    if city:
        parts.append(city)
    if country:
        parts.append(country)
    return ", ".join(parts)


def _resolve_bank_search(question: str) -> Dict[str, Optional[str]]:
    country = extract_country_from_question(question)
    city = extract_city_from_question(question)

    if not country and city:
        country = _infer_country_for_city(city)

    return {"country": country, "city": city}


def handle_greeting(model_name: str) -> Dict[str, Any]:
    return {
        "response_type": "final_answer",
        "response": "Hello! Welcome to InterBankHub. How can I assist you today?",
    }


def handle_bank_lookup(question: str, model_name: str) -> Dict[str, Any]:
    context = _resolve_bank_search(question)
    country = context["country"]
    city = context["city"]

    if country and city:
        banks = get_banks_by_country_and_city(country, city)
        if not banks:
            banks = filter_banks_by_city(get_banks_by_country(country), city)
        scope = f"{city}, {country}"
    elif country:
        banks = get_banks_by_country(country)
        if not banks:
            banks = filter_banks_by_country(get_all_banks(), country)
        scope = country
    elif city:
        banks = filter_banks_by_city(get_all_banks(), city)
        scope = city
    else:
        banks = get_all_banks()
        scope = "all available banks"

    if not banks:
        response_text = llm_text(
            model_name,
            f"Politely inform the customer that no banks were found for {scope}. Suggest they check the spelling or try a different location.",
            {"scope": scope, "banks_found": 0},
        )
    else:
        bank_list = [
            {"name": bank_name(bank), "location": _format_bank_location(bank)}
            for bank in banks
        ]
        response_text = llm_text(
            model_name,
            "Format the following banks as a numbered list. Start with 'Thank you for your interest in opening a bank account. Currently, the following banks are available for account creation:' then list each bank with its location (city, country) as 'Bank Name - City, Country'.",
            {"banks": bank_list},
        )

    return {
        "response_type": "final_answer",
        "response": response_text,
    }


def handle_profile_view(model_name: str, user_id: Optional[str], auth_token: Optional[str], user_type: Optional[str] = None) -> Dict[str, Any]:
    if not user_id:
        return {
            "response_type": "auth_required",
            "response": "Please sign in first, then I can show your profile.",
        }

    # Admin APIs at port 8083 do not require a JWT token
    if not auth_token and user_type != "admin":
        return {
            "response_type": "auth_required",
            "response": "Please sign in again. I need your active session token to fetch profile details.",
        }

    if user_type == "admin":
        return {
            "response_type": "final_answer",
            "response": "Admin profile view is not available via chatbot. Please use the Admin Portal to view your profile details.",
        }

    try:
        user = get_user_by_id(user_id, auth_token)
    except requests.RequestException as exc:
        return {
            "response_type": "final_answer",
            "response": llm_backend_error_response(model_name, "fetch_profile", str(exc)),
        }

    if not user:
        return {
            "response_type": "final_answer",
            "response": "I could not find your profile details at the moment.",
        }

    response_text = llm_text(
        model_name,
        "Show the user profile in a clear banking assistant style with bullet points for id, username, email, and phone.",
        {"profile": clean_user_profile(user)},
    )
    return {"response_type": "final_answer", "response": response_text}


def handle_profile_update(question: str, model_name: str, user_id: Optional[str], auth_token: Optional[str], user_type: Optional[str] = None) -> Dict[str, Any]:
    if not user_id:
        return {
            "response_type": "auth_required",
            "response": "Please sign in first, then I can update your profile.",
        }

    # Admin APIs at port 8083 do not require a JWT token
    if not auth_token and user_type != "admin":
        return {
            "response_type": "auth_required",
            "response": "Please sign in again. I need your active session token to update profile details.",
        }

    if user_type == "admin":
        updates = extract_admin_profile_updates(question)
        if not updates:
            requested_field = extract_requested_admin_profile_field(question)
            if requested_field:
                pending_session_id = uuid.uuid4().hex
                save_session(
                    pending_session_id,
                    {
                        "flow_type": "profile_update_wait_value",
                        "field": requested_field,
                        "user_id": user_id,
                        "auth_token": auth_token,
                        "user_type": "admin",
                        "created_at": time.time(),
                    },
                )
                return {
                    "response_type": "final_answer",
                    "response": f"Sure, please share the new {requested_field} you want to update.",
                    "session_id": pending_session_id,
                }
            return {
                "response_type": "final_answer",
                "response": "Please provide what to update with the new value, for example: change my email to name@example.com or change my username to new_admin.",
            }

        try:
            updated = update_admin_details(user_id, updates, auth_token)
        except requests.RequestException as exc:
            return {
                "response_type": "final_answer",
                "response": llm_backend_error_response(model_name, "update_admin_profile", str(exc)),
            }

        response_text = llm_text(
            model_name,
            "Confirm profile update in a professional tone and show updated fields (username, email, bankname, country) as bullet points.",
            {
                "updated_fields": updates,
                "profile": updated if isinstance(updated, dict) else updates,
            },
        )
        return {"response_type": "final_answer", "response": response_text}

    # --- Regular user flow ---
    updates = extract_profile_updates(question)
    if not updates:
        requested_field = extract_requested_profile_field(question)
        if requested_field:
            pending_session_id = uuid.uuid4().hex
            save_session(
                pending_session_id,
                {
                    "flow_type": "profile_update_wait_value",
                    "field": requested_field,
                    "user_id": user_id,
                    "auth_token": auth_token,
                    "user_type": "user",
                    "created_at": time.time(),
                },
            )
            return {
                "response_type": "final_answer",
                "response": f"Sure, please share the new {requested_field} you want to update.",
                "session_id": pending_session_id,
            }

        return {
            "response_type": "final_answer",
            "response": "Please provide what to update with new value, for example: change my email to name@example.com or change my phone to 9876543210.",
        }

    try:
        updated = update_user_details(user_id, updates, auth_token)
    except requests.RequestException as exc:
        return {
            "response_type": "final_answer",
            "response": llm_backend_error_response(model_name, "update_profile", str(exc)),
        }

    response_text = llm_text(
        model_name,
        "Confirm profile update in a professional tone and show updated username, email, and phone as bullet points.",
        {
            "updated_fields": updates,
            "profile": clean_user_profile(updated) if isinstance(updated, dict) else updates,
        },
    )
    return {"response_type": "final_answer", "response": response_text}


def handle_password_update(question: str, model_name: str, user_id: Optional[str], auth_token: Optional[str], user_type: Optional[str] = None) -> Dict[str, Any]:
    if not user_id:
        return {
            "response_type": "auth_required",
            "response": "Please sign in first, then I can update your password.",
        }

    # Admin APIs at port 8083 do not require a JWT token
    if not auth_token and user_type != "admin":
        return {
            "response_type": "auth_required",
            "response": "Please sign in again. I need your active session token to update your password.",
        }

    if user_type == "admin":
        payload = extract_admin_password_payload(question)
        if not payload["oldPassword"] or not payload["newPassword"]:
            return {
                "response_type": "final_answer",
                "response": "Please provide old and new password in one message, for example: old password is Admin@123, new password is Admin@456.",
            }

        if payload["oldPassword"] == payload["newPassword"]:
            return {
                "response_type": "final_answer",
                "response": "New password must be different from old password.",
            }

        try:
            result = change_admin_password(
                user_id,
                {"oldPassword": payload["oldPassword"], "newPassword": payload["newPassword"]},
                auth_token,
            )
        except requests.RequestException as exc:
            return {
                "response_type": "final_answer",
                "response": llm_backend_error_response(model_name, "update_admin_password", str(exc)),
            }

        return {
            "response_type": "final_answer",
            "response": result or "Password updated successfully.",
        }

    # --- Regular user flow ---
    payload = extract_password_payload(question)
    if not payload["currentPassword"] or not payload["newPassword"]:
        return {
            "response_type": "final_answer",
            "response": "Please provide current and new password in one message, for example: current password is Old@123, new password is New@12345, confirm password is New@12345.",
        }

    if payload["currentPassword"] == payload["newPassword"]:
        return {
            "response_type": "final_answer",
            "response": "New password must be different from current password.",
        }

    if payload["confirmPassword"] and payload["confirmPassword"] != payload["newPassword"]:
        return {
            "response_type": "final_answer",
            "response": "Confirm password does not match the new password.",
        }

    try:
        result = change_user_password(
            user_id,
            {
                "currentPassword": payload["currentPassword"],
                "newPassword": payload["newPassword"],
            },
            auth_token,
        )
    except requests.RequestException as exc:
        return {
            "response_type": "final_answer",
            "response": llm_backend_error_response(model_name, "update_password", str(exc)),
        }

    return {
        "response_type": "final_answer",
        "response": result or "Password updated successfully.",
    }


def handle_pending_profile_update(model_name: str, session_id: str, pending_session: Dict[str, Any], user_reply: str) -> Dict[str, Any]:
    field = pending_session.get("field")
    pending_user_id = pending_session.get("user_id")
    pending_auth_token = pending_session.get("auth_token")
    pending_user_type = pending_session.get("user_type", "user")

    if not field or not pending_user_id or not pending_auth_token:
        remove_session(session_id)
        return {
            "response_type": "final_answer",
            "response": "Your update session expired. Please request the profile update again.",
        }

    if pending_user_type == "admin":
        value = extract_value_for_admin_field(field, user_reply)
    else:
        value = extract_value_for_field(field, user_reply)

    if not value:
        return {
            "response_type": "final_answer",
            "response": f"Please provide a valid {field}.",
            "session_id": session_id,
        }

    try:
        if pending_user_type == "admin":
            updated = update_admin_details(pending_user_id, {field: value}, pending_auth_token)
            response_text = llm_text(
                model_name,
                "Confirm profile update in a professional tone and show updated fields (username, email, bankname, country) as bullet points.",
                {
                    "updated_fields": {field: value},
                    "profile": updated if isinstance(updated, dict) else {field: value},
                },
            )
        else:
            updated = update_user_details(pending_user_id, {field: value}, pending_auth_token)
            response_text = llm_text(
                model_name,
                "Confirm profile update in a professional tone and show updated username, email, and phone as bullet points.",
                {
                    "updated_fields": {field: value},
                    "profile": clean_user_profile(updated) if isinstance(updated, dict) else {field: value},
                },
            )
    except requests.RequestException as exc:
        remove_session(session_id)
        return {
            "response_type": "final_answer",
            "response": llm_backend_error_response(model_name, "update_profile", str(exc)),
        }

    remove_session(session_id)
    return {"response_type": "final_answer", "response": response_text}


def extract_application_id(question: str) -> Optional[str]:
    # Supports IDs like APP123456 and similar alpha-numeric identifiers.
    match = re.search(r"\b([A-Za-z]{2,}[A-Za-z0-9_-]{3,})\b", question)
    if not match:
        return None
    candidate = match.group(1)
    lowered = candidate.lower()
    if lowered in {"check", "status", "application", "progress", "track", "my", "of"}:
        return None
    return candidate


def extract_last4_from_question(question: str) -> Optional[str]:
    lowered = question.lower()
    if "ending" not in lowered and "last 4" not in lowered and "last four" not in lowered:
        return None
    digits = re.findall(r"\d", question)
    if len(digits) < 4:
        return None
    return "".join(digits[-4:])


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


def extract_account_number_from_question(question: str) -> Optional[str]:
    # Common account number patterns: alpha-numeric strings with enough digits.
    candidate_patterns = [
        r"\b[A-Za-z]{0,4}\d{6,}\b",
        r"\b\d{8,}\b",
    ]
    for pattern in candidate_patterns:
        match = re.search(pattern, question)
        if match:
            return match.group(0)
    return None


def clean_account(account: Dict[str, Any]) -> Dict[str, Any]:
    """Return only user-facing fields so the LLM doesn't mention IDs or internal fields."""
    cleaned = {}

    bank_name = account.get("bankName") or account.get("bank")
    account_type = account.get("accountType") or account.get("type")
    status = account.get("status")
    account_number = account.get("accountNumber")
    branch = account.get("branch")
    country = account.get("country")

    if bank_name:
        cleaned["bankName"] = bank_name
    if account_type:
        cleaned["accountType"] = account_type
    if status:
        cleaned["status"] = status
    if account_number:
        cleaned["accountNumber"] = mask_account_number(str(account_number))
    if branch:
        cleaned["branch"] = branch
    if country:
        cleaned["country"] = country

    cleaned["responseDate"] = datetime.now().strftime("%B %d, %Y")
    return cleaned


def clean_application_status(status_details: Dict[str, Any], application_id: str) -> Dict[str, Any]:
    """Normalize application-status payload so LLM gets concrete, user-facing fields."""
    if not isinstance(status_details, dict):
        return {
            "applicationId": application_id,
            "responseDate": datetime.now().strftime("%B %d, %Y"),
        }

    cleaned = {
        "applicationId": application_id,
        "responseDate": datetime.now().strftime("%B %d, %Y"),
    }

    bank_name = status_details.get("bankName") or status_details.get("bank")
    current_status = status_details.get("status") or status_details.get("applicationStatus")
    current_stage = status_details.get("stage") or status_details.get("applicationStage")
    submitted_on = status_details.get("submittedAt") or status_details.get("submittedOn")
    documents_verified_on = status_details.get("documentsVerifiedAt") or status_details.get("documentsVerifiedOn")
    expected_completion = status_details.get("expectedCompletion") or status_details.get("eta")

    if bank_name:
        cleaned["bankName"] = bank_name
    if current_status:
        cleaned["currentStatus"] = current_status
    if current_stage:
        cleaned["applicationStage"] = current_stage
    if submitted_on:
        cleaned["submittedOn"] = submitted_on
    if documents_verified_on:
        cleaned["documentsVerifiedOn"] = documents_verified_on
    if expected_completion:
        cleaned["expectedCompletion"] = expected_completion

    return cleaned


def match_account_by_last4(accounts: List[Dict[str, Any]], last4: str) -> List[Dict[str, Any]]:
    matched = []
    for account in accounts:
        account_number = str(account.get("accountNumber", ""))
        normalized = re.sub(r"\D", "", account_number)
        if normalized.endswith(last4):
            matched.append(account)
    return matched


def llm_text(model_name: str, instruction: str, facts: Dict[str, Any]) -> str:
    prompt = (
        "You are a professional banking assistant writing formal customer communications. "
        "Use only the provided facts. Do not invent data. "
        "Write in the style of an official bank notification: formal greeting, clear bullet-pointed details, "
        "a closing sentence, and end with 'Best regards, Banking Support Team'. "
        "Do not include placeholder text like [Customer Name] or [Bank Name] — use actual values from facts. "
        "Never output bracket placeholders under any condition.\n\n"
        f"Task: {instruction}\n"
        f"Facts JSON:\n{json.dumps(facts, ensure_ascii=True)}\n\n"
        "Format: formal letter style, structured, no extra commentary."
    )
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
    }
    response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=OLLAMA_TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "I could not generate a response at the moment.").strip()


def llm_backend_error_response(model_name: str, operation: str, backend_error: str) -> str:
    try:
        return llm_text(
            model_name,
            "Write a polite and professional banking assistant response for a temporary backend issue. Apologize briefly, do not expose technical internals, and ask the user to retry in a short while.",
            {
                "operation": operation,
                "backend_error": backend_error,
            },
        )
    except requests.RequestException:
        return "I am sorry, I am unable to process your request at the moment. Please try again in a few moments."


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
        "Write a formal bank notification informing the customer of their account status. Include bank name, account type, and current status as bullet points.",
        {"account": clean_account(latest_selected)},
    )
    return {"response_type": "final_answer", "response": response_text}


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
    if session_id and get_session(session_id):
        active_session = get_session(session_id)
        flow_type = str(active_session.get("flow_type") or "account_selection")

        if flow_type == "account_selection":
            selection_input = selected_account_id or question
            return handle_account_selection(
                model_name=model_name,
                session_id=session_id,
                selection_input=selection_input,
            )

        if flow_type == "profile_update_wait_value":
            return handle_pending_profile_update(
                model_name=model_name,
                session_id=session_id,
                pending_session=active_session,
                user_reply=question,
            )

    if is_list_accounts_intent(question):
        resolved_user_id = extract_user_id(question, user_id)
        if not resolved_user_id:
            return {
                "response_type": "auth_required",
                "response": "Please sign in to view your accounts.",
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

        response_text = llm_text(
            model_name,
            "List all user accounts in a formal bank statement style with bank name, masked account number, account type, and status as bullet points.",
            {
                "accounts": [clean_account(a) for a in accounts],
            },
        )
        return {
            "response_type": "final_answer",
            "response": response_text,
        }

    if is_bank_lookup_intent(question):
        return handle_bank_lookup(question, model_name)

    if is_greeting_intent(question):
        return handle_greeting(model_name)

    if is_profile_view_intent(question):
        return handle_profile_view(model_name, user_id, auth_token, user_type)

    if is_profile_update_intent(question):
        return handle_profile_update(question, model_name, user_id, auth_token, user_type)

    if is_password_update_intent(question):
        return handle_password_update(question, model_name, user_id, auth_token, user_type)

    if is_account_status_intent(question):
        resolved_user_id = extract_user_id(question, user_id)
        if not resolved_user_id:
            response_text = "Please sign in to view your account details."
            return {
                "response_type": "auth_required",
                "response": response_text,
            }

        provided_account_number = extract_account_number_from_question(question)
        if provided_account_number:
            account = get_account_by_account_number(provided_account_number)
            if not account:
                return {
                    "response_type": "final_answer",
                    "response": "I could not find an account with that account number. Please verify and try again.",
                }

            account_user_id = str(account.get("userId") or "").strip()
            if account_user_id and account_user_id != str(resolved_user_id):
                return {
                    "response_type": "final_answer",
                    "response": "That account number is not associated with your signed-in user.",
                }

            response_text = llm_text(
                model_name,
                "Write a formal bank notification informing the customer of their account status. Include bank name, account type, and current status as bullet points.",
                {"account": clean_account(account)},
            )
            return {
                "response_type": "final_answer",
                "response": response_text,
            }

        last4 = extract_last4_from_question(question)
        if last4:
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

            matched = match_account_by_last4(accounts, last4)
            if not matched:
                response_text = llm_text(
                    model_name,
                    "Tell user no account matched the provided last 4 digits and ask them to recheck.",
                    {"last4": last4, "accounts_count": len(accounts)},
                )
                return {"response_type": "final_answer", "response": response_text}

            if len(matched) == 1:
                account_number = str(matched[0].get("accountNumber", "")).strip()
                account_details = get_account_by_account_number(account_number) if account_number else matched[0]
                response_text = llm_text(
                    model_name,
                    "Write a formal bank notification informing the customer of their account status. Include bank name, account type, and current status as bullet points.",
                    {"account": clean_account(account_details)},
                )
                return {
                    "response_type": "final_answer",
                    "response": response_text,
                }

            options = selection_options(matched)
            new_session_id = uuid.uuid4().hex
            save_session(
                new_session_id,
                {
                    "flow_type": "account_selection",
                    "user_id": resolved_user_id,
                    "accounts": matched,
                    "created_at": time.time(),
                },
            )
            response_text = llm_text(
                model_name,
                "Ask the user to choose one account because multiple accounts matched the same last 4 digits.",
                {"requested_last4": last4, "account_options": options},
            )
            return {
                "response_type": "selection_required",
                "response": response_text,
                "session_id": new_session_id,
                "options": options,
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
                "Write a formal bank notification informing the customer of their account status. Include bank name, account type, and current status as bullet points.",
                {"account": clean_account(accounts[0])},
            )
            return {
                "response_type": "final_answer",
                "response": response_text,
            }

        new_session_id = uuid.uuid4().hex
        save_session(
            new_session_id,
            {
                "flow_type": "account_selection",
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

    if is_application_status_intent(question):
        resolved_user_id = extract_user_id(question, user_id)
        if not resolved_user_id:
            return {
                "response_type": "auth_required",
                "response": "Please sign in to check your application progress.",
            }

        application_id = extract_application_id(question)
        if not application_id:
            response_text = llm_text(
                model_name,
                "Ask user to provide application ID to check application progress.",
                {
                    "required_field": "application_id",
                    "example": "APP123456",
                },
            )
            return {"response_type": "final_answer", "response": response_text}

        status_details = get_application_status(application_id)

        response_text = llm_text(
            model_name,
            "Write a formal bank notification about the application status. Include key milestone dates and current status as bullet points. End professionally.",
            clean_application_status(status_details, application_id),
        )
        return {"response_type": "final_answer", "response": response_text}

    # Check if RAG has any relevant documents before calling LLM
    retrieved_docs = rag_retriever.retrieve(question, top_k=top_k)
    if not retrieved_docs:
        return {
            "response_type": "final_answer",
            "response": "I'm sorry, I don't have information on that. I can help you with account status, profile updates, bank information, password changes, and application status. Please ask a banking-related question.",
        }
    response = rag_response_fn(
        question,
        rag_retriever,
        api_context=None,
        model_name=model_name,
        top_k=top_k,
    )
    return {"response_type": "final_answer", "response": response}
