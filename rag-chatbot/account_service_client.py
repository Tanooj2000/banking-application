import requests
from typing import List, Dict, Any, Optional

# Set your Spring Boot API base URL here
SPRING_BOOT_BASE_URL = "http://localhost:8080"  # Change as needed

def get_accounts_by_user(user_id: str) -> List[Dict[str, Any]]:
    url = f"{SPRING_BOOT_BASE_URL}/api/accounts/user/{user_id}"
    resp = requests.get(url)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 204:
        return []
    else:
        raise Exception(f"Error: {resp.status_code} - {resp.text}")

def get_accounts_by_status(status: str) -> List[Dict[str, Any]]:
    url = f"{SPRING_BOOT_BASE_URL}/api/accounts/status/{status}"
    resp = requests.get(url)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 204:
        return []
    else:
        raise Exception(f"Error: {resp.status_code} - {resp.text}")

def get_account_by_number(account_number: str) -> Optional[Dict[str, Any]]:
    url = f"{SPRING_BOOT_BASE_URL}/api/accounts/account/{account_number}"
    resp = requests.get(url)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 404:
        return None
    else:
        raise Exception(f"Error: {resp.status_code} - {resp.text}")

def get_application_status(application_id: str) -> Optional[Dict[str, Any]]:
    url = f"{SPRING_BOOT_BASE_URL}/api/accounts/status/{application_id}"
    resp = requests.get(url)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 404:
        return None
    else:
        raise Exception(f"Error: {resp.status_code} - {resp.text}")
