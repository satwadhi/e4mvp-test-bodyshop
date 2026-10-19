import os
import re
import uuid
import asyncio
import hashlib
import logging
from html import escape
from pathlib import Path
from datetime import datetime, timezone, timedelta, date
from typing import Annotated, List, Optional
from zoneinfo import ZoneInfo

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Form, BackgroundTasks, Response, Request
from starlette.datastructures import UploadFile as StarletteUploadFile
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, AliasChoices
from pymongo.errors import DuplicateKeyError
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import hash_password, verify_password, create_token, get_current_owner  # noqa: E402
from storage import init_storage, put_object, get_object, APP_NAME  # noqa: E402
from email_service import send_email, EMAIL_FROM_NAME  # noqa: E402
from shop_config import DEFAULT_SHOP_SETTINGS, SAMPLE_GALLERY, SAMPLE_REVIEWS  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("server")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Auto Body Shop API", openapi_url="/api/openapi.json", docs_url="/api/docs", redoc_url=None)
api = APIRouter(prefix="/api")

STATUSES = ["Requested", "Confirmed", "Declined", "Completed"]
MAX_PHOTOS = 3
MAX_PHOTO_BYTES = 10 * 1024 * 1024
DUPLICATE_WINDOW = timedelta(minutes=2)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


# ---------- Models ----------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, validation_alias=AliasChoices("_id", "id"))

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self) -> dict:
        data = self.model_dump()
        oid = data.pop("id", None)
        if oid:
            data["_id"] = ObjectId(oid)
        return data


class Photo(BaseModel):
    id: str
    storage_path: str
    content_type: str
    original_filename: str
    size: int


class Appointment(BaseDocument):
    name: str
    phone: str
    email: Optional[str] = None
    vehicle_year: str = ""
    vehicle_make: str = ""
    vehicle_model: str = ""
    service: str = ""
    preferred_date: str
    preferred_time: str = ""
    notes: str = ""
    photos: List[Photo] = []
    status: str = "Requested"
    source: str = "website"
    email_notification: Optional[str] = None
    created_at: str
    updated_at: str


class GalleryItem(BaseDocument):
    title: str
    category: str = ""
    url: str
    is_sample: bool = False
    created_at: str


class Review(BaseDocument):
    name: str
    rating: int
    text: str
    is_sample: bool = False
    created_at: str


class LoginIn(BaseModel):
    email: str
    password: str


class OwnerAppointmentIn(BaseModel):
    name: str = ""
    phone: str = ""
    email: Optional[str] = None
    vehicle_year: str = ""
    vehicle_make: str = ""
    vehicle_model: str = ""
    service: str = ""
    preferred_date: str = ""
    preferred_time: str = ""
    notes: str = ""
    status: str = "Confirmed"


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_settings() -> dict:
    doc = await db.settings.find_one({"key": "shop"}, {"_id": 0})
    return doc or DEFAULT_SHOP_SETTINGS


def shop_today(settings: dict) -> date:
    return datetime.now(ZoneInfo(settings.get("timezone") or "UTC")).date()


def validate_name_phone(name: str, phone: str) -> tuple[str, str]:
    name, phone = (name or "").strip(), (phone or "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    if len(re.sub(r"\D", "", phone)) < 7:
        raise HTTPException(status_code=422, detail="A valid phone number is required")
    return name, phone


def validate_date(value: str, settings: dict) -> str:
    try:
        d = date.fromisoformat((value or "").strip())
    except ValueError:
        raise HTTPException(status_code=422, detail="Preferred date is required (YYYY-MM-DD)")
    if d < shop_today(settings):
        raise HTTPException(status_code=422, detail="Preferred date cannot be in the past")
    return d.isoformat()


def validate_time(value: str, required: bool) -> str:
    value = (value or "").strip()
    if not value:
        if required:
            raise HTTPException(status_code=422, detail="Preferred time is required")
        return ""
    if not TIME_RE.match(value):
        raise HTTPException(status_code=422, detail="Preferred time must be HH:MM")
    return value


def validate_email(value: Optional[str]) -> Optional[str]:
    value = (value or "").strip()
    if value and not EMAIL_RE.match(value):
        raise HTTPException(status_code=422, detail="Email address is invalid")
    return value or None


async def acquire_submission_lock(fingerprint: str):
    now = datetime.now(timezone.utc)
    try:
        await db.submission_locks.insert_one({"_id": fingerprint, "created_at": now})
        return
    except DuplicateKeyError:
        pass
    cutoff = now - DUPLICATE_WINDOW
    res = await db.submission_locks.update_one(
        {"_id": fingerprint, "created_at": {"$lt": cutoff}}, {"$set": {"created_at": now}}
    )
    if res.modified_count == 0:
        raise HTTPException(
            status_code=409,
            detail="This request was already submitted. Please wait a couple of minutes before sending it again.",
        )


async def get_appointment_or_404(appointment_id: str) -> Appointment:
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=404, detail="Appointment not found")
    doc = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return Appointment.from_mongo(doc)


def fmt_time(t: str) -> str:
    if not t:
        return "—"
    h, m = map(int, t.split(":"))
    return f"{(h % 12) or 12}:{m:02d} {'AM' if h < 12 else 'PM'}"


def build_owner_email(a: Appointment, shop_name: str) -> tuple[str, str]:
    vehicle = " ".join(x for x in [a.vehicle_year, a.vehicle_make, a.vehicle_model] if x) or "—"
    rows = [
        ("Name", escape(a.name)),
        ("Phone", f'<a href="tel:{escape(re.sub(r"[^0-9+]", "", a.phone))}" style="color:#FF3B30">{escape(a.phone)}</a>'),
        ("Email", f'<a href="mailto:{escape(a.email)}" style="color:#FF3B30">{escape(a.email)}</a>' if a.email else "—"),
        ("Vehicle", escape(vehicle)),
        ("Service", escape(a.service or "—")),
        ("Preferred date", escape(a.preferred_date)),
        ("Preferred time", escape(fmt_time(a.preferred_time))),
        ("Notes", escape(a.notes or "—").replace("\n", "<br>")),
        ("Damage photos", f"{len(a.photos)} attached (view in owner dashboard)" if a.photos else "None"),
        ("Submitted", escape(a.created_at[:19].replace("T", " ")) + " UTC"),
    ]
    row_html = "".join(
        f'<tr><td style="padding:8px 12px;color:#666;font-size:13px;width:140px;vertical-align:top">{k}</td>'
        f'<td style="padding:8px 12px;color:#111;font-size:14px">{v}</td></tr>'
        for k, v in rows
    )
    subject = f"New appointment request: {a.name} — {a.service or 'Service'} on {a.preferred_date}"
    html = (
        '<table role="presentation" width="100%" style="font-family:Arial,sans-serif;background:#f4f4f6;padding:24px">'
        '<tr><td><table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-top:4px solid #FF3B30">'
        f'<tr><td style="padding:20px 24px"><h2 style="margin:0;color:#111">New Appointment Request</h2>'
        f'<p style="margin:6px 0 0;color:#666;font-size:13px">Submitted via the {escape(shop_name)} website.</p></td></tr>'
        f'<tr><td style="padding:0 12px 12px"><table role="presentation" width="100%">{row_html}</table></td></tr>'
        f'<tr><td style="padding:16px 24px;color:#888;font-size:12px;border-top:1px solid #eee">'
        f'Sign in to the {escape(shop_name)} owner dashboard to confirm or decline this request.</td></tr>'
        '</table></td></tr></table>'
    )
    return subject, html


async def notify_owner(appointment_id: str):
    try:
        appt = await get_appointment_or_404(appointment_id)
        settings = await get_settings()
        to = settings.get("notification_email")
        logger.info(f"[email] Sending owner notification for appointment {appointment_id} to {to}")
        subject, html = build_owner_email(appt, settings.get("name") or EMAIL_FROM_NAME)
        email_id = await send_email(to=to, subject=subject, html=html, reply_to=appt.email)
        logger.info(f"[email] SUCCESS appointment={appointment_id} to={to} resend_id={email_id}")
        result = "sent"
    except Exception as e:
        logger.error(f"[email] FAILED appointment={appointment_id}: {e}")
        result = f"failed: {str(e)[:200]}"
    await db.appointments.update_one({"_id": ObjectId(appointment_id)}, {"$set": {"email_notification": result}})


# ---------- Public routes ----------
@api.get("/")
async def root():
    return {"status": "ok"}


@api.get("/settings")
async def public_settings():
    s = await get_settings()
    return {k: v for k, v in s.items() if k not in ("notification_email", "key")}


@api.get("/gallery", response_model=List[GalleryItem])
async def list_gallery():
    docs = await db.gallery.find({}).sort("created_at", 1).to_list(200)
    return [GalleryItem.from_mongo(d) for d in docs]


@api.get("/reviews", response_model=List[Review])
async def list_reviews():
    docs = await db.reviews.find({}).sort("created_at", 1).to_list(200)
    return [Review.from_mongo(d) for d in docs]


@api.post("/appointments", status_code=201)
async def create_appointment_request(
    request: Request,
    background_tasks: BackgroundTasks,
    name: str = Form(""),
    phone: str = Form(""),
    email: str = Form(""),
    vehicle_year: str = Form(""),
    vehicle_make: str = Form(""),
    vehicle_model: str = Form(""),
    service: str = Form(""),
    preferred_date: str = Form(""),
    preferred_time: str = Form(""),
    notes: str = Form(""),
):
    form = await request.form()
    photos = [f for f in form.getlist("photos") if isinstance(f, StarletteUploadFile)]
    settings = await get_settings()
    name, phone = validate_name_phone(name, phone)
    email_clean = validate_email(email)
    preferred_date = validate_date(preferred_date, settings)
    preferred_time = validate_time(preferred_time, required=True)
    service = service.strip()
    valid_services = [s["title"] for s in settings.get("services", [])] + ["Other"]
    if service and service not in valid_services:
        raise HTTPException(status_code=422, detail="Please choose a service from the list")

    files = [f for f in photos if f.filename]
    if len(files) > MAX_PHOTOS:
        raise HTTPException(status_code=422, detail=f"You can upload up to {MAX_PHOTOS} photos")
    payloads = []
    for f in files:
        if not (f.content_type or "").startswith("image/"):
            raise HTTPException(status_code=422, detail=f"'{f.filename}' is not an image")
        data = await f.read()
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=422, detail=f"'{f.filename}' is larger than 10MB")
        if data:
            payloads.append((f, data))

    fp_src = "|".join(x.strip().lower() for x in [
        name, re.sub(r"\D", "", phone), email_clean or "", vehicle_year, vehicle_make, vehicle_model,
        service, preferred_date, preferred_time, notes,
    ])
    fingerprint = hashlib.sha256(fp_src.encode()).hexdigest()
    await acquire_submission_lock(fingerprint)

    stored: List[Photo] = []
    try:
        for f, data in payloads:
            ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else "jpg"
            path = f"{APP_NAME}/damage-photos/{uuid.uuid4()}.{ext}"
            res = await asyncio.to_thread(put_object, path, data, f.content_type)
            stored.append(Photo(id=str(uuid.uuid4()), storage_path=res["path"], content_type=f.content_type,
                                original_filename=f.filename, size=res.get("size", len(data))))
    except Exception as e:
        logger.error(f"Photo upload failed: {e}")
        await db.submission_locks.delete_one({"_id": fingerprint})
        raise HTTPException(status_code=502, detail="Photo upload failed. Please try again or submit without photos.")

    ts = now_iso()
    appt = Appointment(
        name=name, phone=phone, email=email_clean, vehicle_year=vehicle_year.strip(),
        vehicle_make=vehicle_make.strip(), vehicle_model=vehicle_model.strip(), service=service,
        preferred_date=preferred_date, preferred_time=preferred_time, notes=notes.strip(), photos=stored,
        status="Requested", source="website", email_notification="pending", created_at=ts, updated_at=ts,
    )
    result = await db.appointments.insert_one(appt.to_mongo())
    appt.id = str(result.inserted_id)
    background_tasks.add_task(notify_owner, appt.id)
    return {"id": appt.id, "status": appt.status, "message": "Your appointment request has been received."}


# ---------- Auth ----------
@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.strip().lower()
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"_id": email})
    if attempt and attempt.get("count", 0) >= 5 and attempt["last"].replace(tzinfo=timezone.utc) > now - timedelta(minutes=15):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one({"_id": email}, {"$inc": {"count": 1}, "$set": {"last": now}}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"_id": email})
    return {"token": create_token(str(user["_id"]), email), "user": {"id": str(user["_id"]), "email": email, "name": user.get("name")}}


@api.get("/auth/me")
async def me(owner: dict = Depends(get_current_owner)):
    return owner


# ---------- Admin ----------
admin = APIRouter(prefix="/api/admin", dependencies=[Depends(get_current_owner)])


@admin.get("/appointments", response_model=List[Appointment])
async def admin_list(status: Optional[str] = None, sort: str = "newest"):
    query = {}
    if status:
        if status not in STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status")
        query["status"] = status
    docs = await db.appointments.find(query).sort("created_at", -1).to_list(2000)
    items = [Appointment.from_mongo(d) for d in docs]
    if sort == "upcoming":
        today = shop_today(await get_settings()).isoformat()
        upcoming = sorted([a for a in items if a.preferred_date >= today], key=lambda a: (a.preferred_date, a.preferred_time))
        past = sorted([a for a in items if a.preferred_date < today], key=lambda a: (a.preferred_date, a.preferred_time), reverse=True)
        items = upcoming + past
    return items


@admin.get("/appointments/{appointment_id}", response_model=Appointment)
async def admin_get(appointment_id: str):
    return await get_appointment_or_404(appointment_id)


@admin.post("/appointments", response_model=Appointment, status_code=201)
async def admin_create(body: OwnerAppointmentIn):
    settings = await get_settings()
    name, phone = validate_name_phone(body.name, body.phone)
    if body.status not in STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status")
    ts = now_iso()
    appt = Appointment(
        name=name, phone=phone, email=validate_email(body.email), vehicle_year=body.vehicle_year.strip(),
        vehicle_make=body.vehicle_make.strip(), vehicle_model=body.vehicle_model.strip(), service=body.service.strip(),
        preferred_date=validate_date(body.preferred_date, settings),
        preferred_time=validate_time(body.preferred_time, required=False), notes=body.notes.strip(),
        status=body.status, source="owner", created_at=ts, updated_at=ts,
    )
    result = await db.appointments.insert_one(appt.to_mongo())
    appt.id = str(result.inserted_id)
    return appt


@admin.patch("/appointments/{appointment_id}", response_model=Appointment)
async def admin_update(appointment_id: str, body: AppointmentUpdate):
    appt = await get_appointment_or_404(appointment_id)
    updates = {}
    if body.status is not None:
        if body.status not in STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status")
        updates["status"] = body.status
    if body.preferred_date is not None and body.preferred_date != appt.preferred_date:
        updates["preferred_date"] = validate_date(body.preferred_date, await get_settings())
    if body.preferred_time is not None:
        updates["preferred_time"] = validate_time(body.preferred_time, required=False)
    if not updates:
        return appt
    updates["updated_at"] = now_iso()
    await db.appointments.update_one({"_id": ObjectId(appointment_id)}, {"$set": updates})
    return await get_appointment_or_404(appointment_id)


@admin.delete("/appointments/{appointment_id}")
async def admin_delete(appointment_id: str):
    await get_appointment_or_404(appointment_id)
    await db.appointments.delete_one({"_id": ObjectId(appointment_id)})
    return {"deleted": True}


@admin.get("/appointments/{appointment_id}/photos/{photo_id}")
async def admin_photo(appointment_id: str, photo_id: str):
    appt = await get_appointment_or_404(appointment_id)
    photo = next((p for p in appt.photos if p.id == photo_id), None)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    try:
        data, _ = await asyncio.to_thread(get_object, photo.storage_path)
    except Exception as e:
        logger.error(f"Photo fetch failed: {e}")
        raise HTTPException(status_code=502, detail="Could not load photo")
    return Response(content=data, media_type=photo.content_type, headers={"Cache-Control": "private, max-age=3600"})


app.include_router(api)
app.include_router(admin)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Startup / seeding ----------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.appointments.create_index([("created_at", -1)])
    await db.appointments.create_index("status")
    await db.submission_locks.create_index("created_at", expireAfterSeconds=180)

    await db.settings.update_one({"key": "shop"}, {"$setOnInsert": DEFAULT_SHOP_SETTINGS}, upsert=True)

    admin_email = os.environ["ADMIN_EMAIL"].strip().lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Shop Owner", "role": "owner", "created_at": now_iso()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"_id": existing["_id"]}, {"$set": {"password_hash": hash_password(admin_password)}})

    if not await db.gallery.count_documents({"is_sample": True}):
        base = datetime.now(timezone.utc)
        await db.gallery.insert_many([
            GalleryItem(**g, is_sample=True, created_at=(base + timedelta(seconds=i)).isoformat()).to_mongo()
            for i, g in enumerate(SAMPLE_GALLERY)
        ])
    if not await db.reviews.count_documents({"is_sample": True}):
        base = datetime.now(timezone.utc)
        await db.reviews.insert_many([
            Review(**r, is_sample=True, created_at=(base + timedelta(seconds=i)).isoformat()).to_mongo()
            for i, r in enumerate(SAMPLE_REVIEWS)
        ])


@app.on_event("startup")
async def on_startup():
    await seed()
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
