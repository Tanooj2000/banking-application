from typing import Any, Dict
import requests

ADMIN_SERVICE_BASE_URL = "http://localhost:8083/api/admin"


def _auth_headers(auth_token: str | None) -> Dict[str, str]:
    if auth_token and auth_token.strip():
        return {"Authorization": f"Bearer {auth_token.strip()}"}
    return {}


def _parse_json_or_empty(response: requests.Response) -> Dict[str, Any]:
    if response.status_code == 204:
        return {}
    response.raise_for_status()
    try:
        data = response.json()
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def _normalize_admin_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(data.get("admin"), dict):
        return data["admin"]
    return data


def update_admin_details(admin_id: str, update_data: Dict[str, Any], auth_token: str | None = None) -> Dict[str, Any]:
    """PUT /api/admin/{id}  — body: {username, email, bankname, country}"""
    response = requests.put(
        f"{ADMIN_SERVICE_BASE_URL}/{admin_id}",
        json=update_data,
        headers=_auth_headers(auth_token),
        timeout=20,
    )
    return _normalize_admin_payload(_parse_json_or_empty(response))


def change_admin_password(admin_id: str, password_data: Dict[str, Any], auth_token: str | None = None) -> str:
    """PUT /api/admin/{id}/password  — body: {oldPassword, newPassword}"""
    response = requests.put(
        f"{ADMIN_SERVICE_BASE_URL}/{admin_id}/password",
        json=password_data,
        headers=_auth_headers(auth_token),
        timeout=20,
    )
    if response.status_code == 204:
        return "Password updated successfully."
    response.raise_for_status()
    return response.text.strip() if response.text else "Password updated successfully."
