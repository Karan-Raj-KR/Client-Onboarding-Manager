# Kagaz

> A WhatsApp enquiry in. A branded quotation, GST-ready invoice, and UPI payment link out.

Kagaz is an AI back-office prototype for Indian freelancers and agencies. It turns unstructured, often Hinglish, client enquiries into an editable deal and branded quotation. When the client accepts, it creates an invoice, a payment-link record, and a reminder workflow—without rebuilding the deal by hand.

## Why Kagaz?

Indian freelancers commonly sell through WhatsApp, collect through UPI, and need GST-aware documents. Most global quote-to-cash products assume forms or CRMs, USD pricing, Stripe/PayPal, and US tax workflows. Kagaz is built around India’s working rails.

## Demo flow

1. Paste a WhatsApp-style enquiry (or use the cached Hinglish transcript).
2. Review the AI-extracted scope, budget, and timeline in the deal card.
3. Select rate-card items and generate a branded quotation PDF.
4. Open the public quotation link and tap **Accept**.
5. See the invoice, UPI/payment link, armed reminder, and dashboard update.

## Features

- Hinglish-friendly enquiry extraction with human review
- Rate-card pricing and branded quotation PDF
- Public acceptance link
- GST-ready invoice fields with SAC code support
- Mock/Razorpay-test payment-link adapter
- Pipeline dashboard for enquiries, quoted value, won value, and collected value

## Tech stack

Next.js, TypeScript, Tailwind CSS, SQLite/Prisma, an LLM with structured JSON output, and React-pdf or server-side HTML-to-PDF. The payment and transcription integrations are adapter-based and have deterministic local fallbacks.

## Run locally

```bash
cd takeover
npm install
npm run dev
```

Set `LLM_API_KEY` for live extraction. The seeded/cached flow works without it. Use `PAYMENT_MODE=mock` for the hackathon demo; no real money is collected.

## Architecture

```text
Enquiry → AI extraction → editable deal → rate card → quotation PDF/public link
                                                       ↓ accept
                         dashboard ← invoice + payment-link record + reminder
```

## Important prototype boundaries

Kagaz generates a payment link; it does not process a payment in this prototype. Invoice fields are GST-ready but this is not GST e-invoice filing or tax advice. WhatsApp ingestion and live provider integrations are planned post-hackathon.

## Team

Built for TakeOver’26 by Karan Raj KR, Havinash Gangisetty, and Saagnik Dey.

## Roadmap

WhatsApp Business ingestion, real Razorpay links and webhooks, GST e-invoicing integration, vertical rate-card templates, multilingual input, and automated reminders.
