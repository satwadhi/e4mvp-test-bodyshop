import os
import logging

import requests

logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "autobody-shop"

storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def _request(method: str, path: str, **kwargs):
    for attempt in range(2):
        key = init_storage(force=attempt > 0)
        headers = {"X-Storage-Key": key, **kwargs.pop("headers", {})}
        resp = requests.request(method, f"{STORAGE_URL}/objects/{path}", headers=headers, **kwargs)
        if resp.status_code == 404 and attempt == 0 and method == "PUT":
            continue
        resp.raise_for_status()
        return resp
    return resp


def put_object(path: str, data: bytes, content_type: str) -> dict:
    return _request("PUT", path, headers={"Content-Type": content_type}, data=data, timeout=120).json()


def get_object(path: str) -> tuple[bytes, str]:
    resp = _request("GET", path, timeout=60)
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
