# Technical Requirements Document — Kagaz

## 1. Recommended fast stack

| Layer | Choice | Rationale |
|---|---|---|
| Web app | Next.js + TypeScript | One repo, API routes, public routes, fast UI iteration |
| Styling | Tailwind CSS | Rapid responsive polish |
| Validation | Zod | Shared API/LLM schemas |
| Database | SQLite + Prisma (or JSON repository fallback) | Zero onboarding; replaceable later |
| LLM | Existing provider SDK, structured JSON mode | Extract Hinglish enquiry into deal fields |
| PDFs | React-pdf or server HTML-to-PDF | Branded quote/invoice generation |
| Payments | Razorpay test link adapter; deterministic mock fallback | No transaction or onboarding dependency |

Use tools the team already knows; this is a default, not a mandate. Do not introduce a separate backend or queue in the hackathon.

## 2. Modules

- `inbox`: accepts enquiry text and optional cached transcript.
- `extraction`: prompts LLM, validates JSON, returns an editable deal draft.
- `rates`: exposes owner rate card and pricing calculations.
- `documents`: renders quotation and invoice PDFs from immutable snapshots.
- `acceptance`: verifies public token, atomically accepts quote, then triggers cascade.
- `payments`: returns `mock` or Razorpay test payment-link metadata through one interface.
- `dashboard`: computes status counts and rupee totals from deals/payment records.

## 3. LLM contract

System instruction: extract only facts stated or reasonably inferred; use `null` for unknown values; preserve ambiguity in `notes`; never invent GSTIN, contact details, commercial terms, or exact prices. Required JSON shape:

```json
{
  "client_name": "string|null",
  "client_phone": "string|null",
  "project_title": "string",
  "scope_summary": "string",
  "requirements": ["string"],
  "budget_min": 30000,
  "budget_max": 40000,
  "timeline_days": 14,
  "language": "hinglish",
  "missing_information": ["string"],
  "confidence": 0.0,
  "notes": "string|null"
}
```

If the provider fails, return a deterministic cached extraction matched to the demo text and let the owner continue. Clearly flag it as a fallback in logs, not in the presentation UI.

## 4. Engineering requirements

- Keep document numbering in server code: `Q-YYYY-####`, `INV-YYYY-####`.
- Store monetary values as integer paise, never floats.
- Use a transaction for quote acceptance, invoice creation, and status change.
- Make acceptance idempotent with `accepted_at` check / unique invoice-per-quote constraint.
- Persist document input snapshots so later rate-card edits cannot change issued PDFs.
- Feature-flag `PAYMENT_MODE=mock|razorpay_test` and `TRANSCRIPTION_MODE=cached|provider`.

## 5. Environment variables

```bash
DATABASE_URL="file:./dev.db"
LLM_API_KEY="..."
LLM_MODEL="..."
APP_URL="http://localhost:3000"
PAYMENT_MODE="mock"
RAZORPAY_KEY_ID="optional"
RAZORPAY_KEY_SECRET="optional"
```

## 6. Performance and resilience

- API request target: <2s excluding model/PDF generation; show a friendly loading state.
- Timeout model calls after 12s, then use fallback or enable manual deal entry.
- Generate PDFs once and retain their URL/path; do not regenerate on every view.
- No external API is required to run seed-data demo flow.
