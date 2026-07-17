# Kagaz — Documentation Pack

**Kagaz** is an AI back-office for Indian freelancers: a messy enquiry becomes an editable deal, a branded quotation, and—after acceptance—a GST-ready invoice and UPI/Razorpay payment link.

This package assumes a 24-hour hackathon. It makes the text-enquiry flow reliable first; voice transcription, real WhatsApp, real Razorpay, and GST e-invoicing are explicitly non-critical integrations.

| Document | Purpose |
|---|---|
| [01-PRD.md](01-PRD.md) | Product intent, users, requirements, success criteria |
| [02-TRD.md](02-TRD.md) | Implementation choices and engineering requirements |
| [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Components, data flow, deployment boundaries |
| [04-API-SPEC.md](04-API-SPEC.md) | REST contract for frontend/backend integration |
| [05-DATABASE-SCHEMA.md](05-DATABASE-SCHEMA.md) | Relational schema, states, seed data |
| [06-USER-STORIES.md](06-USER-STORIES.md) | Prioritized stories and acceptance criteria |
| [07-MVP-PLAN.md](07-MVP-PLAN.md) | Scope, milestones, team hand-offs |
| [08-TESTING-AND-RISKS.md](08-TESTING-AND-RISKS.md) | Test plan, demo hardening, risk register |
| [README.md](README.md) | Judge-facing repository README draft |

## Product decision

Use **Kagaz** as the working name: it is short, memorable, India-native, and maps naturally to quotations and invoices. Keep the product claim precise: Kagaz creates a **payment-link workflow**, not a live payment transaction or legal GST filing system.
