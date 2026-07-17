# Product Requirements Document — Kagaz

**Version:** Hackathon MVP v0.1  
**Primary theme:** AI Document Generation + Autonomous Workflow Agents  
**Target user:** Indian freelancers and small agencies who receive enquiries on WhatsApp.

## 1. Problem and opportunity

A typical enquiry arrives as unstructured Hinglish text or a voice note. Turning it into a quote, following up, then recreating it as an invoice consumes 1–2 hours and introduces delay when intent is highest. Existing tools assume CRM/form input, USD pricing, Stripe/PayPal, and US tax workflows. Kagaz is designed around WhatsApp-style input, GST fields, and UPI/Razorpay-style collection.

## 2. Product goal

In under 60 seconds, a freelancer can convert an enquiry into a reviewed, branded quotation link. When a client accepts it, Kagaz creates an invoice and a payment-link record, arms reminders, and updates the pipeline.

## 3. Success metrics for the demo

| Metric | Target |
|---|---:|
| Text enquiry to editable deal card | <10 seconds |
| Approved deal to quotation | <10 seconds |
| Acceptance cascade displayed | <5 seconds |
| Demo critical-path failure rate | 0 / 3 rehearsals |
| Seed pipeline | 3+ historical deals |

## 4. Personas

- **Owner / freelancer:** sets business profile and rate card; reviews AI extraction; sends quotes; monitors collection.
- **Client:** opens public quotation link, reviews summary, accepts it.
- **Demo operator:** may inject a cached transcript and simulated payment status; never handles actual funds.

## 5. Core journey

1. Owner pastes or receives a WhatsApp-style enquiry.
2. AI extracts client, scope, budget, timeline, and confidence into a draft deal.
3. Owner edits missing or incorrect details and selects rate-card line items.
4. Kagaz calculates amounts and generates a branded quotation PDF plus public acceptance link.
5. Client accepts the quotation.
6. Kagaz marks the deal won, creates a GST-ready invoice PDF, creates a Razorpay/UPI payment-link record, schedules reminders, and refreshes dashboard totals.

## 6. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Accept pasted text enquiry; provide a WhatsApp-styled inbox UI. | Must |
| FR-02 | Extract structured deal fields using an LLM with a validated JSON response. | Must |
| FR-03 | Let owner edit every AI-populated field before quotation generation. | Must |
| FR-04 | Store a business profile and rate card with services, SAC code, unit price, and tax rate. | Must |
| FR-05 | Generate a branded, downloadable quotation PDF with unique quote number. | Must |
| FR-06 | Provide a public quote page with Accept action. | Must |
| FR-07 | On acceptance, create a GST-ready invoice PDF and a payment-link record/URL. | Must |
| FR-08 | Show enquiry, quoted, won and collected totals in a dashboard. | Must |
| FR-09 | Seed prior deals for a credible dashboard. | Must |
| FR-10 | Transcribe uploaded voice note or play cached transcript. | Should |
| FR-11 | Send actual WhatsApp, email, or payment reminders. | Could; mock for MVP |
| FR-12 | Live payment reconciliation / real GST e-invoice filing. | Out of scope |

## 7. Business rules

- AI output is always draft; no document is issued without owner review.
- Quote expiry defaults to 7 days; owner can change it.
- A quote is accepted once only. Repeated visits show accepted state.
- Invoice number is created only after acceptance.
- GST data is editable and labelled “GST-ready”; validity remains user responsibility.
- Payment status is `pending` at creation; demo may mark it `paid` without collecting money.

## 8. Non-functional requirements

- Responsive UI for desktop demo and mobile client page.
- All critical screens usable with local seed data and one environment variable for LLM access.
- Server validates payloads and never trusts browser-calculated totals.
- Public links use long random tokens; no personally identifying data appears in URLs.
- PDF layouts must be readable and printable on A4.
- Log workflow errors with request/deal IDs; never log API keys.

## 9. Explicit non-goals

Authentication, multi-user organizations, legal contracts/e-signatures, automatic accounting, real WhatsApp Business onboarding, actual money movement, payment webhooks, GST filing, and production-grade reminder delivery are post-hackathon scope.
