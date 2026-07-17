# Database Schema — Kagaz MVP

Use SQLite with Prisma or equivalent. IDs are UUID/CUID strings; timestamps are UTC. Amounts ending `_paise` are integers.

| Table | Key fields | Notes |
|---|---|---|
| `business_profiles` | `id`, `legal_name`, `brand_name`, `gstin`, `address`, `bank_or_upi_handle`, `logo_url` | One seeded profile in MVP |
| `rate_card_items` | `id`, `business_id`, `name`, `description`, `sac_code`, `unit_price_paise`, `tax_rate_bps`, `active` | Owner pricing source |
| `enquiries` | `id`, `business_id`, `source`, `raw_text`, `transcript`, `received_at` | Raw source preserved |
| `deals` | `id`, `enquiry_id`, `client_name`, `client_phone`, `project_title`, `scope_summary`, `budget_min_paise`, `budget_max_paise`, `timeline_days`, `status`, `extraction_json`, `confidence_bps` | Editable working record |
| `deal_line_items` | `id`, `deal_id`, `rate_card_item_id`, `description`, `quantity`, `unit_price_paise`, `tax_rate_bps` | Snapshot price at editing time |
| `quotes` | `id`, `deal_id`, `number`, `public_token`, `status`, `valid_until`, `subtotal_paise`, `tax_paise`, `total_paise`, `snapshot_json`, `accepted_at` | One active quote/deal in MVP |
| `invoices` | `id`, `quote_id`, `number`, `status`, `issued_at`, `due_at`, `snapshot_json`, `pdf_path` | Unique `quote_id` |
| `payments` | `id`, `invoice_id`, `provider`, `provider_payment_link_id`, `payment_url`, `amount_paise`, `status`, `paid_at` | `mock` is supported |
| `reminders` | `id`, `invoice_id`, `scheduled_for`, `channel`, `status`, `body` | Mark `armed` in demo |
| `documents` | `id`, `entity_type`, `entity_id`, `kind`, `path`, `created_at` | `quotation` / `invoice` PDFs |

## Important constraints and indexes

- `business_profiles.gstin` nullable, unique when present.
- `quotes.public_token` unique; use 32+ random bytes base64url/hex.
- `invoices.quote_id` unique prevents duplicate invoices.
- Index `deals.status`, `quotes.status`, `payments.status`, and `created_at` fields for dashboard queries.
- Use `snapshot_json` to freeze legal/business/client line items and totals for generated documents.

## Seed data

Create the KĀRYO profile, four rate-card items (website, branding, social media, consultation), and at least three historical deals: one `paid`, one `payment_pending`, and one `quoted`. The live demo deal should be a ₹35,000 restaurant website quote.
