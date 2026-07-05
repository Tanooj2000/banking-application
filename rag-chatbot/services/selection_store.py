from typing import Dict, Any
import time
from threading import Lock


_SELECTION_TTL_SECONDS = 15 * 60
_selection_store: Dict[str, Dict[str, Any]] = {}
_selection_lock = Lock()


def cleanup_expired_sessions() -> None:
    now = time.time()
    with _selection_lock:
        expired_keys = [
            key for key, value in _selection_store.items()
            if now - value.get("created_at", now) > _SELECTION_TTL_SECONDS
        ]
        for key in expired_keys:
            del _selection_store[key]


def save_session(session_id: str, session_data: Dict[str, Any]) -> None:
    with _selection_lock:
        _selection_store[session_id] = session_data


def get_session(session_id: str) -> Dict[str, Any] | None:
    with _selection_lock:
        return _selection_store.get(session_id)


def remove_session(session_id: str) -> None:
    with _selection_lock:
        if session_id in _selection_store:
            del _selection_store[session_id]
