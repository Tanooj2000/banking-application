from typing import Any, Dict, List
import requests


BANK_SERVICE_BASE_URL = "http://localhost:8082/api/banks"


def _extract_bank_list(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]

    if isinstance(data, dict):
        for key in ("banks", "data", "results", "items"):
            value = data.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]

    return []


def _call_bank_service(path: str) -> List[Dict[str, Any]]:
    response = requests.get(f"{BANK_SERVICE_BASE_URL}{path}", timeout=20)
    if response.status_code == 204:
        return []
    response.raise_for_status()
    return _extract_bank_list(response.json())


def get_all_banks() -> List[Dict[str, Any]]:
    for path in ("", "/all"):
        try:
            return _call_bank_service(path)
        except requests.RequestException:
            continue
    return []


def get_banks_by_country(country: str) -> List[Dict[str, Any]]:
    if not country:
        return []
    return _call_bank_service(f"/country/{country}")


def get_banks_by_country_and_city(country: str, city: str) -> List[Dict[str, Any]]:
    if not country or not city:
        return []
    return _call_bank_service(f"/country/{country}/city/{city}")


def bank_name(bank: Dict[str, Any]) -> str:
    return str(bank.get("bankName") or bank.get("name") or bank.get("bank") or "Unknown Bank").strip()


def bank_country(bank: Dict[str, Any]) -> str:
    return str(bank.get("country") or bank.get("countryName") or "").strip()


def bank_city(bank: Dict[str, Any]) -> str:
    return str(bank.get("city") or bank.get("branchCity") or bank.get("location") or "").strip()


def filter_banks_by_city(banks: List[Dict[str, Any]], city: str) -> List[Dict[str, Any]]:
    if not city:
        return banks

    city_lower = city.lower().strip()
    filtered: List[Dict[str, Any]] = []
    for bank in banks:
        values = [
            bank_city(bank),
            str(bank.get("branch") or "").strip(),
            str(bank.get("location") or "").strip(),
        ]
        if any(city_lower == value.lower() or city_lower in value.lower() for value in values if value):
            filtered.append(bank)
    return filtered


def filter_banks_by_country(banks: List[Dict[str, Any]], country: str) -> List[Dict[str, Any]]:
    if not country:
        return banks

    country_lower = country.lower().strip()
    filtered: List[Dict[str, Any]] = []
    for bank in banks:
        values = [bank_country(bank), str(bank.get("countryName") or "").strip()]
        if any(country_lower == value.lower() or country_lower in value.lower() for value in values if value):
            filtered.append(bank)
    return filtered
