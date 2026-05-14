from typing import Any, Dict
import requests


USER_SERVICE_BASE_URL = "http://localhost:8081/api/user"


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


def _normalize_user_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    # Some endpoints wrap user as {"user": {...}} or {"success": true, "user": {...}}
    if isinstance(data.get("user"), dict):
        return data["user"]
    return data


def get_user_by_id(user_id: str, auth_token: str | None = None) -> Dict[str, Any]:
    response = requests.get(
        f"{USER_SERVICE_BASE_URL}/{user_id}",
        headers=_auth_headers(auth_token),
        timeout=20,
    )
    return _normalize_user_payload(_parse_json_or_empty(response))


def update_user_details(user_id: str, update_data: Dict[str, Any], auth_token: str | None = None) -> Dict[str, Any]:
    response = requests.put(
        f"{USER_SERVICE_BASE_URL}/{user_id}",
        json=update_data,
        headers=_auth_headers(auth_token),
        timeout=20,
    )
    return _normalize_user_payload(_parse_json_or_empty(response))


def change_user_password(user_id: str, password_data: Dict[str, Any], auth_token: str | None = None) -> str:
    response = requests.put(
        f"{USER_SERVICE_BASE_URL}/{user_id}/password",
        json=password_data,
        headers=_auth_headers(auth_token),
        timeout=20,
    )
    if response.status_code == 204:
        return "Password updated successfully."
    response.raise_for_status()
    return response.text.strip() if response.text else "Password updated successfully."
