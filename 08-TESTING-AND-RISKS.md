# Testing Plan and Risk Register

## Test plan

| Area | Checks |
|---|---|
| Extraction | Hinglish demo text maps scope/budget/timeline; unknown fields become null; malformed model JSON falls back safely. |
| Deal editing | Invalid quantities/tax rejected; paise totals are exact; changing a line item updates total. |
| Documents | Quote/invoice contain correct number, client, business, GST/SAC, itemization, taxes, total; PDF opens and prints A4. |
| Acceptance | First tap creates one invoice/payment/reminder; repeat tap returns same result; expired quote cannot accept. |
| Dashboard | Seed totals match manual calculation; acceptance updates won, not collected; mock paid updates collected. |
| Links/UI | Public quote works incognito and on phone; download and copy-link actions work. |
| Demo | Run full 90-second path twice with network disabled/fallback mode and once in presentation environment. |

### Minimum automated tests

- Pricing/tax calculation and rupee formatting.
- Extraction schema validation and fallback selection.
- Acceptance idempotency / single invoice constraint.
- Dashboard aggregation.

## Risk register

| Risk | Likelihood | Impact | Mitigation / fallback | Owner |
|---|---|---|---|---|
| LLM timeout or malformed output | Medium | High | 12s timeout; cached extraction and manual edit path | Karan |
| WhatsApp API setup consumes build time | High | Medium | Time-box to hour 2; use styled inbox | Team |
| Razorpay onboarding/keys unavailable | Medium | High | Payment adapter returns deterministic UPI/mock link | Karan |
| PDF visual defects | Medium | High | Freeze a tested A4 template early; visual inspect generated PDFs | Havinash |
| Acceptance creates duplicates | Medium | High | Transaction, unique invoice-per-quote, idempotency key | Karan |
| Frontend/backend integration drift | High | High | Agree API fixtures by hour 3; integration checkpoint at hour 10 | Team |
| Empty-looking dashboard | High | Medium | Seed three deals with varied statuses before UI polish | Saagnik |
| Live demo network failure | Medium | High | Local seed data, cached transcript, screenshots/PDFs available | Saagnik |
| GST claims overstate compliance | Medium | High | Say “GST-ready invoice fields”; do not claim e-invoice filing | Karan |
| Scope creep | High | High | P0 only until two successful rehearsals | Team |
