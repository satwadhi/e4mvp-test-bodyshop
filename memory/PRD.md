# PRD — Auto Paint & Body Shop (Phase 1)

## Original problem statement
Landing page + owner management area for an auto paint & body (collision repair) shop. FARM stack, all backend routes under /api, /api/openapi.json reachable. Placeholder shop info stored in ONE editable settings doc. Dark bold theme with red accent, mobile-first, sticky header with Book Now. Public: hero, services, gallery from DB (6 samples, is_sample), reviews from DB (4 samples), appointment request form (validation, no past dates, up to 3 damage photos in Emergent Object Storage, double-submit prevention), contact footer. Owner email via Emergent Resend on each request (failure must not break booking). /admin: JWT owner login, appointments dashboard (filter by status, details incl. photos, status change, add owner appointment with source badge, edit date/time, delete). Admin APIs 401 without auth.
Out of scope: gallery uploads, review management, customer emails/SMS, calendar view.

## User choices (approved)
Red accent (#FF3B30) · notification email owner@example.com · owner login owner@autobodyshop.com / Owner@12345 · AI-generated sample gallery.

## Architecture
- Backend: FastAPI `server.py` (routes, models w/ BaseDocument/PyObjectId, seeding), `auth.py` (bcrypt + PyJWT), `storage.py` (Emergent Object Storage), `email_service.py` (Emergent Resend proxy + guardrail gate), `shop_config.py` (placeholder settings + sample data, seeded into Mongo `settings` doc key="shop" via $setOnInsert).
- Collections: settings, users, appointments, gallery, reviews, submission_locks (2-min duplicate guard, TTL), login_attempts (5 fails → 15-min lockout).
- Frontend: React, pages Landing / Admin, components under components/site and components/admin.

## Implemented (2026-10-19)
- All public sections, lightbox, placeholder banner (toggle via settings.is_placeholder)
- Booking form with frontend + backend validation, photo picker (3 × 10MB, images only), 409 on identical resubmission within 2 min
- Owner email notification in background task; result logged `[email] ...` and stored on appointment.email_notification
- Owner dashboard: stats, filters, search, newest/upcoming sort, status change, details sheet with damage photos (blob fetch), edit date/time, delete, add owner appointment
- Testing: iteration_1 — 22/22 backend, frontend flows passed; past-date error now shown inline in details sheet

## Known environment blockers
- EMERGENT_EMAIL_KEY not provisioned → emails currently fail (logged, booking unaffected)
- Object storage /init returns 500 upstream → photo submissions currently return 502

## Swap-in checklist (when owner sends info)
Edit Mongo `settings` doc (key="shop") or edit shop_config.py, delete the doc, restart backend: name, logo_text/logo_url, tagline, phone, email, address, hours, services, notification_email, timezone, is_placeholder=false. Update EMAIL_FROM_NAME in backend/.env. Re-match accent color in index.css.

## Backlog
- P1: Owner gallery uploads, review management
- P1: Customer confirmation email/SMS
- P2: Calendar view, admin settings editor UI
