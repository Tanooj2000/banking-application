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
