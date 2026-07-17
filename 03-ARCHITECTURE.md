# System Architecture — Kagaz

```mermaid
flowchart LR
  A["WhatsApp-style enquiry\ntext / cached voice transcript"] --> B["Inbox + Deal API"]
  B --> C["LLM extraction\nvalidated JSON"]
  C --> D["Editable deal card"]
  D --> E["Rate-card pricing"]
  E --> F["Quotation PDF + public link"]
  F --> G["Client acceptance page"]
  G --> H["Acceptance transaction"]
  H --> I["Invoice PDF"]
  H --> J["UPI/Razorpay link adapter"]
  H --> K["Reminder record"]
  H --> L["Dashboard totals"]
  M[(SQLite / Prisma)] --- B
  M --- H
  M --- L
```

## Boundaries

The app owns extraction, review, pricing, PDF creation, document states, and dashboard calculations. A payment provider only receives an amount/reference after client acceptance. WhatsApp, transcription, payment creation, and reminders have adapters so each can be simulated without breaking the core demonstration.

## State transitions

`new → extracted → draft → quoted → accepted → invoiced → payment_pending → paid`

`quoted → expired` is valid after expiry. `accepted` is terminal for the quote and cannot be revoked in MVP; create a new quote instead.

## Public link security

Generate a cryptographically random token per quote, store only a hash if time permits, and resolve `/q/{token}` server-side. The page can read only that quote’s client-facing fields. Acceptance is a POST protected by same-site origin checks and an idempotency key.
