# Payment Location Tracking

This project is an admin dashboard for tracking mentor session claims and mentor payouts.

Mentors teach sessions in three modules:

- Physical location sessions
- Home location sessions
- Online sessions

Mentors submit claims once every month. A claim can contain any number of completed sessions for a learner course, from 1 session up to the full 12-session course. The admin reviews the monthly claim, approves it, and pays the mentor based on the number of sessions included in that claim. Once payment is completed, the claim and the related sessions are marked as paid and reflected on the dashboard.

## Main Logic

The app currently runs from `src/app/App.tsx` and uses local React state with mock data. There is no backend persistence yet, so changes reset when the page refreshes.

The workflow is:

1. A mentor completes one or more sessions for a learner course during the month.
2. At the end of the month, the mentor submits one claim for those completed sessions.
3. The claim stores the mentor, learner, course name, module, claim month, and completed session count.
4. The claim can also reference related session records through `sessionIds`.
5. The admin opens the **Mentor Claims** page.
6. Submitted claims can be approved.
7. Approved claims can be paid.
8. Paying a claim opens the payment page with learner, mentor, course, module, session count, claim month, and payout amount already synced from the claim.
9. The admin only fills the payout method details.
10. Completing payment marks the claim as `paid` and updates the linked sessions to `paid`.

## Screens

### Dashboard

The dashboard shows earnings summaries for:

- Physical sessions
- Home sessions
- Online sessions

It also shows session tables, payment status, mentor details, and module-level earnings.

### Mentor Claims

The claims page shows incoming mentor claims with:

- Claim ID
- Mentor name
- Learner name
- Claim month
- Module
- Course description
- Completed session count
- Payout amount
- Claim status
- Admin action

Claim statuses are:

- `submitted`: claim has arrived from the mentor and needs admin review.
- `approved`: claim has been approved and is ready for payout.
- `paid`: mentor has been paid for that claim.

### Payment Page

The payment page handles mentor payouts.

When opened from an approved claim, learner and course details are locked and synced from that claim. The admin does not re-enter them.

Supported payout methods are:

- MPESA
- Bank Transfer

All mentors use the same bank for bank-transfer payouts, so the bank name is fixed in the payment form.

## Data Model

### Session

A session represents a completed or pending class handled by a mentor.

Important fields:

- `id`: unique session ID
- `mentor`: mentor name
- `learner`: learner name
- `date`: session date
- `description`: course or lesson description
- `module`: `physical`, `home`, or `online`
- `status`: `paid` or `pending`
- `location`: only used for physical sessions
- `amount`: payout amount after payment
- `paymentMethod`: method used for payout

### Mentor Claim

A claim represents a mentor request for payment for completed sessions in a given month. It can be for one session, several sessions, or the full 12-session course.

Important fields:

- `id`: unique claim ID
- `sessionIds`: links the claim to the related session records in the dashboard
- `mentor`: mentor being paid
- `learner`: learner attached to the completed course
- `courseName`: completed course name
- `module`: `physical`, `home`, or `online`
- `claimMonth`: month being claimed
- `completedSessions`: number of completed sessions included in this monthly claim
- `totalSessions`: total sessions required for the course, currently 12
- `submittedAt`: date the mentor submitted the claim
- `status`: `submitted`, `approved`, or `paid`
- `notes`: optional admin or mentor notes

## Payout Rates

The app uses fixed per-session mentor payout rates:

- Physical session mentor payout: `KSh 904`
- Home session mentor payout: `KSh 904`
- Online session mentor payout: `KSh 500`

The claim payout amount is calculated from the number of sessions in the claim:

```text
per-session mentor rate x completed sessions
```

Examples:

- 1 physical session claim: `KSh 904`
- 6 online sessions claim: `KSh 3,000`
- Full 12-session physical course claim: `KSh 10,848`

For a full 12-session course:

- Physical course payout: `KSh 10,848`
- Home course payout: `KSh 10,848`
- Online course payout: `KSh 6,000`

The dashboard also tracks Digifunzi and location earnings for summary purposes.

## Running The Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Current Limitation

All session, claim, approval, and payment changes are stored in browser memory through React state. A backend or local storage layer would be needed to keep changes after refresh and to receive real claims from mentor accounts.
