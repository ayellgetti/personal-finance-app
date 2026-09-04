# Banquet CRM — Project Context

This file contains project-specific defaults. Update it as the product evolves.

## Product

A CRM/workflow application for banquet/event enquiries, follow-ups, bookings, event details, packages, and operational coordination.

## Typical entities

Potential entities include:
- enquiry
- customer
- event
- venue
- package
- menu
- follow-up
- booking
- payment
- staff/manpower

Do not assume exact fields or relationships without checking the current schema/specification.

## Workflow

The sales pipeline is these eight enquiry stages only (do not add extras):
1. New
2. Contacted
3. Qualified
4. Discussion
5. Quotation Sent
6. Negotiation
7. Schedule Meeting / Site Visit
8. Closed

## Payments

Use only these enums — do not add extras:

PaymentType: INCOME, EXPENSE

PaymentMode: CASH, UPI, CARD, BANK_TRANSFER, CHEQUE

## Shareable walkthroughs

Public CRM pages (no login), same HTML-in-iframe pattern as Freedom Planner `/guide`:

- `http://crm.local.uat/banquet` — WhatsApp banquet enquiry → event booking
- `http://crm.local.uat/real-estate` — WhatsApp 2BHK enquiry → unit booking
- `http://crm.local.uat/freedom` — myfinancefreedom.com sales agent → Freedom Planner onboarding

Do not add extra pipeline stages for menu, décor, token, or demo. Those are notes, follow-ups, tasks, calendar, and payments after Convert.
