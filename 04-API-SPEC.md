# API Specification — Kagaz MVP

All JSON endpoints use `/api/v1`. Owner endpoints are locally trusted for the hackathon; add auth middleware post-event. Errors use `{ "error": { "code": "...", "message": "..." } }`.

| Method / path | Purpose |
|---|---|
| `POST /enquiries/extract` | Create enquiry and extract deal draft |
| `GET /deals` | List dashboard deals |
| `GET /deals/:id` | Retrieve editable deal |
| `PATCH /deals/:id` | Update reviewed deal / line items |
| `POST /deals/:id/quote` | Issue quote and PDF/public link |
| `GET /quotes/:token` | Public client quote view |
| `POST /quotes/:token/accept` | Atomically accept quote and create cascade artifacts |
| `GET /dashboard/summary` | Pipeline figures |
| `GET /documents/:id/download` | Download a stored PDF |

## POST `/enquiries/extract`

```json
{ "source": "whatsapp_simulated", "raw_text": "bhai restaurant ke liye website chahiye...", "use_cached_transcript": false }
```

Returns `201` with `{ "enquiry": {...}, "deal": { "id": "dl_01", "status": "draft", "extraction": {...} } }`.

## PATCH `/deals/:id`

```json
{
  "client_name": "Aditi's Kitchen",
  "project_title": "Restaurant website with ordering",
  "scope_summary": "Five-page website and online ordering setup.",
  "timeline_days": 14,
  "line_items": [{ "rate_card_item_id": "rc_web", "quantity": 1, "unit_price_paise": 3500000 }],
  "tax_rate_bps": 1800
}
```

Returns the server-calculated subtotal, tax and total.

## POST `/deals/:id/quote`

```json
{ "valid_until": "2026-07-24", "notes_to_client": "50% advance to initiate." }
```

Returns `201`: `{ "quote": { "id": "qt_01", "number": "Q-2026-0001", "public_url": "https://app.example/q/<token>", "pdf_url": "/api/v1/documents/doc_01/download" } }`.

## POST `/quotes/:token/accept`

```json
{ "accepted_by_name": "Aditi Sharma", "idempotency_key": "uuid" }
```

Returns `200` with quote, invoice PDF URL, `{ "mode": "mock", "payment_url": "upi://pay?..." }`, reminder status, and fresh dashboard summary. On a duplicate request, return the same artifacts with `200`; do not create a second invoice.

## GET `/dashboard/summary`

```json
{
  "counts": { "enquiries": 8, "quoted": 4, "won": 3 },
  "amounts_paise": { "quoted": 11000000, "won": 8500000, "collected": 5000000 },
  "currency": "INR"
}
```
