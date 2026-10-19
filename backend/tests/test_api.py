"""Backend API tests for Auto Body Shop app."""
import io
import os
import time
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

OWNER_EMAIL = "owner@autobodyshop.com"
OWNER_PASSWORD = "Owner@12345"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def owner_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}"}


# ---------- Public ----------
def test_openapi(api):
    r = api.get(f"{BASE_URL}/api/openapi.json")
    assert r.status_code == 200
    assert "paths" in r.json()


def test_public_settings(api):
    r = api.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert "name" in data and "services" in data
    assert "notification_email" not in data  # must be hidden


def test_gallery_seeded(api):
    r = api.get(f"{BASE_URL}/api/gallery")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 6
    assert all("url" in g for g in items)


def test_reviews_seeded(api):
    r = api.get(f"{BASE_URL}/api/reviews")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 4


# ---------- Appointments (public) ----------
def _future_date(days=3):
    return (date.today() + timedelta(days=days)).isoformat()


def test_create_appointment_missing_name_phone(api):
    r = api.post(f"{BASE_URL}/api/appointments", data={"name": "", "phone": ""})
    assert r.status_code == 422


def test_create_appointment_past_date(api):
    r = api.post(f"{BASE_URL}/api/appointments", data={
        "name": "TEST_PastDate", "phone": "5551234567",
        "preferred_date": "2020-01-01", "preferred_time": "10:00",
    })
    assert r.status_code == 422
    assert "past" in r.text.lower()


def test_create_appointment_invalid_time(api):
    r = api.post(f"{BASE_URL}/api/appointments", data={
        "name": "TEST_BadTime", "phone": "5551234567",
        "preferred_date": _future_date(), "preferred_time": "25:99",
    })
    assert r.status_code == 422


def test_create_appointment_missing_time(api):
    r = api.post(f"{BASE_URL}/api/appointments", data={
        "name": "TEST_NoTime", "phone": "5551234567",
        "preferred_date": _future_date(), "preferred_time": "",
    })
    assert r.status_code == 422


def test_create_appointment_too_many_photos(api):
    files = [("photos", (f"a{i}.jpg", b"\xff\xd8\xff\xe0dummy", "image/jpeg")) for i in range(4)]
    r = api.post(f"{BASE_URL}/api/appointments", data={
        "name": "TEST_TooManyPhotos", "phone": "5551234567",
        "preferred_date": _future_date(), "preferred_time": "10:00",
    }, files=files)
    assert r.status_code == 422


def test_create_appointment_non_image(api):
    r = api.post(f"{BASE_URL}/api/appointments", data={
        "name": "TEST_NonImage", "phone": "5559990001",
        "preferred_date": _future_date(), "preferred_time": "10:00",
    }, files=[("photos", ("not.txt", b"hello", "text/plain"))])
    assert r.status_code == 422


_created_ids = []


def test_create_appointment_happy_and_duplicate(api):
    payload = {
        "name": "TEST_HappyPath",
        "phone": "5557771234",
        "email": "test_happy@example.com",
        "vehicle_year": "2020",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "service": "Collision Repair",
        "preferred_date": _future_date(5),
        "preferred_time": "11:00",
        "notes": "TEST happy path",
    }
    r = api.post(f"{BASE_URL}/api/appointments", data=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "Requested"
    assert "id" in body
    _created_ids.append(body["id"])
    # Duplicate within 2 min
    r2 = api.post(f"{BASE_URL}/api/appointments", data=payload)
    assert r2.status_code == 409


def test_email_notification_recorded(api, auth_headers):
    assert _created_ids, "requires previous happy-path test"
    aid = _created_ids[0]
    # background task may take a moment
    val = None
    for _ in range(10):
        r = api.get(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers)
        assert r.status_code == 200
        val = r.json().get("email_notification")
        if val and val != "pending":
            break
        time.sleep(1)
    assert val is not None
    # In this env email key is missing, so expect 'failed:' prefix; sent is also acceptable
    assert val.startswith("failed:") or val == "sent", f"unexpected: {val}"


# ---------- Auth ----------
def test_login_wrong_password(api):
    # Use a non-owner email to avoid lockout
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_auth(api):
    r = api.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code in (401, 403)


def test_me_with_token(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == OWNER_EMAIL


# ---------- Admin ----------
def test_admin_endpoints_require_auth(api):
    for path, method in [
        ("/api/admin/appointments", "get"),
        ("/api/admin/appointments", "post"),
    ]:
        r = api.request(method, f"{BASE_URL}{path}")
        assert r.status_code == 401, f"{path} {method} returned {r.status_code}"


def test_admin_invalid_token(api):
    r = api.get(f"{BASE_URL}/api/admin/appointments", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401


def test_admin_list_and_filters(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/admin/appointments", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    r = api.get(f"{BASE_URL}/api/admin/appointments?status=Requested", headers=auth_headers)
    assert r.status_code == 200
    r = api.get(f"{BASE_URL}/api/admin/appointments?sort=upcoming", headers=auth_headers)
    assert r.status_code == 200
    r = api.get(f"{BASE_URL}/api/admin/appointments?status=Bogus", headers=auth_headers)
    assert r.status_code == 422


def test_admin_create_owner_appointment(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/admin/appointments", headers=auth_headers, json={
        "name": "TEST_OwnerEntry",
        "phone": "5558887777",
        "preferred_date": _future_date(7),
        "preferred_time": "14:00",
        "status": "Confirmed",
    })
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["source"] == "owner"
    assert data["status"] == "Confirmed"
    _created_ids.append(data["id"])


def test_admin_update_status_and_date(api, auth_headers):
    assert _created_ids
    aid = _created_ids[-1]
    r = api.patch(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers, json={"status": "Completed"})
    assert r.status_code == 200
    assert r.json()["status"] == "Completed"
    # past date reject
    r = api.patch(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers, json={"preferred_date": "2020-01-01"})
    assert r.status_code == 422
    # valid date
    nd = _future_date(10)
    r = api.patch(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers, json={"preferred_date": nd, "preferred_time": "09:00"})
    assert r.status_code == 200
    assert r.json()["preferred_date"] == nd
    assert r.json()["preferred_time"] == "09:00"


def test_admin_delete(api, auth_headers):
    # Create a disposable, then delete
    r = api.post(f"{BASE_URL}/api/admin/appointments", headers=auth_headers, json={
        "name": "TEST_ToDelete", "phone": "5551112222",
        "preferred_date": _future_date(2), "preferred_time": "10:00",
        "status": "Requested",
    })
    assert r.status_code == 201
    aid = r.json()["id"]
    r = api.delete(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers)
    assert r.status_code == 200
    r = api.get(f"{BASE_URL}/api/admin/appointments/{aid}", headers=auth_headers)
    assert r.status_code == 404


def test_cleanup(api, auth_headers):
    """Cleanup test-created appointments."""
    r = api.get(f"{BASE_URL}/api/admin/appointments", headers=auth_headers)
    for a in r.json():
        if a.get("name", "").startswith("TEST_"):
            api.delete(f"{BASE_URL}/api/admin/appointments/{a['id']}", headers=auth_headers)
