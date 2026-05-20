# Payment Location Tracking

Payment Location Tracking is a React admin dashboard for managing Digifunzi mentor session claims and mentor payouts across physical-location, home-location, and online learning sessions.

The application helps an admin review monthly mentor claims, approve valid claims, complete payouts through MPESA or bank transfer, and see payment status reflected across the dashboard.

## Table of Contents

- [Overview](#overview)
- [Core Workflow](#core-workflow)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Application Pages](#application-pages)
- [Data Model](#data-model)
- [Payout Logic](#payout-logic)
- [Current Data Source](#current-data-source)
- [Development Notes](#development-notes)
- [Limitations](#limitations)
- [Recommended Next Steps](#recommended-next-steps)

## Overview

Mentors teach learner sessions in three modules:

- Physical location sessions
- Home location sessions
- Online sessions

At the end of each month, mentors submit claims for completed sessions. A claim may cover one session, multiple sessions, or a full 12-session course. The admin reviews each submitted claim, approves it, and pays the mentor according to the module rate and the number of completed sessions.

When payment is completed, the claim is marked as paid and any linked session records are also updated as paid.

## Core Workflow

1. A mentor completes one or more learner sessions during the month.
2. The mentor submits a monthly claim for those completed sessions.
3. The claim records mentor, learner, course, module, claim month, completed session count, and linked session IDs.
4. The admin opens the Mentor Claims page.
5. Submitted claims can be approved.
6. Approved claims can be paid.
7. Paying a claim opens the payment page with claim details already populated.
8. The admin selects or enters payout method details.
9. Completing payment marks the claim as paid.
10. Linked sessions are updated to paid and reflected on the dashboard.

## Features

- Dashboard summaries for physical, home, and online modules
- Mentor claim review workflow
- Claim status tracking: submitted, approved, and paid
- Claim amount calculations based on module rates and completed session counts
- Payment form for mentor payouts
- MPESA and bank-transfer payout options
- Shared bank name handling for bank transfers
- Search by mentor, learner, or course name
- Module filtering across dashboard and claims views
- Mentor detail modal with claim and earning summaries
- Responsive table/card layouts for desktop and mobile views
- Mock data for sessions, claims, learners, mentors, courses, and payout examples

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- Radix UI primitives
- shadcn-style local UI components
- Lucide React icons
- date-fns

## Project Structure

```text
Payment-location-tracking/
|-- index.html
|-- package.json
|-- package-lock.json
|-- vite.config.ts
|-- postcss.config.mjs
|-- default_shadcn_theme.css
|-- pnpm-workspace.yaml
|-- README.md
`-- src/
    |-- main.tsx
    |-- app/
    |   |-- App.tsx
    |   `-- components/
    |       |-- figma/
    |       `-- ui/
    `-- styles/
        |-- fonts.css
        |-- globals.css
        |-- index.css
        |-- tailwind.css
        `-- theme.css
```

Key files:

- `src/main.tsx`: React entry point.
- `src/app/App.tsx`: Main application state, mock data, claim workflow, payment workflow, dashboard UI, and modal UI.
- `src/app/components/ui/`: Reusable UI primitives.
- `src/styles/`: Global CSS, theme, Tailwind, and font styles.
- `vite.config.ts`: Vite configuration, React plugin, Tailwind plugin, path alias, and Figma asset resolver.

## Getting Started

### Prerequisites

Install Node.js before running the project. A current LTS version is recommended.

This repository includes a `package-lock.json`, so `npm` is the safest package manager to use unless the project is intentionally migrated to another package manager.

### Installation

```bash
npm install
```

### Run the Development Server

```bash
npm run dev
```

Vite will print the local development URL in the terminal. It is usually:

```text
http://localhost:5173/
```

### Build for Production

```bash
npm run build
```

The production build is generated in the `dist/` directory.

## Available Scripts

```bash
npm run dev
```

Starts the local Vite development server.

```bash
npm run build
```

Creates a production build.

## Application Pages

### Dashboard

The dashboard is the default page. It shows module-level earning summaries and session or claim details for the selected module.

The dashboard includes:

- Physical, home, and online module summary cards
- Session and claim tables
- Paid and pending status indicators
- Search input for filtering visible records
- Mentor detail modal with per-mentor claim history and earning totals

### Mentor Claims

The Mentor Claims page is used by the admin to review incoming mentor claims.

Claims include:

- Claim ID
- Mentor name
- Learner name
- Claim month
- Module
- Course name
- Completed session count
- Total session count
- Payout amount
- Claim status
- Admin action

Claim statuses:

- `submitted`: the claim has arrived and needs admin review.
- `approved`: the claim has been approved and is ready for payout.
- `paid`: the mentor has been paid for the claim.

### Payment Page

The Payment page handles mentor payouts.

When opened from an approved claim, the page automatically fills in:

- Learner
- Mentor
- Payment date
- Module
- Course description
- Location when applicable
- Payout amount

The admin then completes payout method details.

Supported payout methods:

- MPESA
- Bank Transfer

For bank transfers, the shared bank name is currently fixed as:

```text
KCB Bank
```

## Data Model

The app currently defines its core types in `src/app/App.tsx`.

### Session

A `Session` represents a learner session handled by a mentor.

Important fields:

- `id`: unique session ID
- `mentor`: mentor name
- `date`: session date
- `learner`: learner name
- `description`: course or lesson description
- `module`: `physical`, `home`, or `online`
- `status`: `paid` or `pending`
- `location`: physical-session location, when relevant
- `amount`: payout amount after payment
- `paymentMethod`: payout method used after payment

### MentorClaim

A `MentorClaim` represents a monthly mentor request for payment.

Important fields:

- `id`: unique claim ID
- `sessionIds`: linked session records
- `mentor`: mentor requesting payment
- `learner`: learner attached to the course
- `courseName`: completed course name
- `module`: `physical`, `home`, or `online`
- `claimMonth`: month being claimed
- `completedSessions`: number of sessions included in the claim
- `totalSessions`: total sessions required for the course, currently 12
- `submittedAt`: claim submission date
- `status`: `submitted`, `approved`, or `paid`
- `notes`: optional claim notes

### PaymentFormState

`PaymentFormState` stores the payment form values while the admin is completing a payout.

Important fields include:

- Learner, mentor, date, module, description, location, and amount
- Selected payment method
- MPESA phone number
- Bank account number and account name
- Shared bank name

Some card and cash-related fields are still present in the form state, but the current UI focuses on MPESA and bank transfer.

## Payout Logic

The app uses fixed mentor payout rates in Kenyan shillings.

| Module | Mentor rate per session |
| --- | ---: |
| Physical | KSh 904 |
| Home | KSh 904 |
| Online | KSh 500 |

Claim payout amount:

```text
mentor rate per session x completed sessions
```

Examples:

| Claim | Calculation | Payout |
| --- | --- | ---: |
| 1 physical session | 904 x 1 | KSh 904 |
| 6 online sessions | 500 x 6 | KSh 3,000 |
| 12 physical sessions | 904 x 12 | KSh 10,848 |
| 12 home sessions | 904 x 12 | KSh 10,848 |
| 12 online sessions | 500 x 12 | KSh 6,000 |

The app also defines Digifunzi and location earning rates for dashboard summary purposes:

- Digifunzi rate: `KSh 500`
- Physical location rate: `KSh 500`

## Current Data Source

The app currently uses local mock data defined in `src/app/App.tsx`:

- `mockSessions`
- `additionalMockSessions`
- `mockClaims`

Application changes are stored in React state only. This means approvals, payments, new manual payments, and session status changes reset when the page is refreshed.

## Development Notes

- The app is currently implemented as a single-page React app inside `src/app/App.tsx`.
- Page navigation is handled with local React state through `activePage`.
- Claim filtering uses the selected module and search query.
- Approved claim payment uses `selectedClaimId` to sync claim details into the payment form.
- After claim payment, linked sessions are updated using the claim's `sessionIds`.
- The `@` alias points to `src`.
- The local `figmaAssetResolver` in `vite.config.ts` maps `figma:asset/...` imports to `src/assets/...`.

## Limitations

- No backend API is connected yet.
- No database or persistent local storage is used.
- No authentication or role-based access control is implemented.
- Claims cannot currently be submitted from a real mentor account.
- Payment completion is simulated in the UI.
- There is no automated test suite yet.
- Most domain logic and UI live in a single large component, which makes future scaling harder.

## Recommended Next Steps

- Add persistent storage through a backend API or local storage layer.
- Split `src/app/App.tsx` into smaller components and domain utilities.
- Move mock data into dedicated fixture files.
- Add tests for payout calculations, claim status transitions, and payment submission behavior.
- Add mentor authentication and real claim submission.
- Add admin authentication and permission checks.
- Add payment provider integration for real MPESA or bank-transfer workflows.
- Add error handling, loading states, and audit logs for payment actions.
- Add linting and formatting scripts.
