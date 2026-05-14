from typing import List, Dict, Any
import requests


ACCOUNT_SERVICE_BASE_URL = "http://localhost:8085/api/accounts"


def _call_account_service(path: str) -> List[Dict[str, Any]]:
    response = requests.get(f"{ACCOUNT_SERVICE_BASE_URL}{path}", timeout=20)
    if response.status_code == 204:
        return []
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, list) else []


def get_accounts_by_user_id(user_id: str) -> List[Dict[str, Any]]:
    return _call_account_service(f"/user/{user_id}")


def get_accounts_by_bank_name(bank_name: str) -> List[Dict[str, Any]]:
    return _call_account_service(f"/bank/{bank_name}")


def get_accounts_by_status(status: str) -> List[Dict[str, Any]]:
    return _call_account_service(f"/status/{status}")


def get_application_status(application_id: str) -> Dict[str, Any]:
    response = requests.get(f"{ACCOUNT_SERVICE_BASE_URL}/status/{application_id}", timeout=20)
    if response.status_code == 204:
        return {}
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, dict) else {}


def get_account_by_account_number(account_number: str) -> Dict[str, Any]:
    response = requests.get(f"{ACCOUNT_SERVICE_BASE_URL}/account/{account_number}", timeout=20)
    if response.status_code == 204:
        return {}
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and data:
        first = data[0]
        return first if isinstance(first, dict) else {}
    return {}
