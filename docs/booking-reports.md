# Elysium Hall booking reports

Route: `/admin/reports`. Admin authentication is required for both JSON and XLSX APIs. No workbook or financial data is published in public assets.

The original user workbook is a layout reference only. Historical customer records and budgets are not imported. The 14 columns follow its 2026 monthly layout. Excel exports contain the selected month or all 12 months of the selected year.

- Report reads Elysium Hall bookings by event date, with pagination and deterministic ordering. Gallery/tour bookings are excluded.
- Dashboard refreshes every 30 seconds while visible and on focus. Downloads query the database again. Downloaded files are snapshots; they do not update themselves.
- confirmed/completed → CONFIRM; pending/quoted/awaiting_payment → TENTATIVE; cancelled/rejected → CANCEL.
- Admin uses Edit to enter the agreed quotation gross amount, applicable SST percentage, sector CODE, payment method, sales person, operations PIC and remarks. Customer budget is never treated as agreed revenue. PDF uploads are not parsed to guess amounts.
- Blank amount or tax rate remains unknown; an entered zero is preserved. Totals exclude unknown amounts and display a missing count. Confirmed tax/net totals are withheld in the export if inputs are incomplete. SST is calculated per booking, rounded to cents, using the admin-entered rate rather than the template's old fixed 6% formula.
- Revenue totals represent quotation value by booking status, not payment receipts or accounting revenue recognition.
- Spreadsheet customer text is written as literal strings, not formula cells. Only application-generated total cells are formulas.
- No budget/variance values are invented. Source template budgets require a separately agreed process before being added.

Database setup: `docs/booking-report-rollout.sql`, additive table with RLS and no anon/authenticated grants. Server-only API checks the existing admin registry before using the service role. Setup applied and checked 22 October 2026: RLS true, public/client read false, service access true, no report records created during setup.

Validation: 27 unit/export tests and TypeScript pass. Live local unauthenticated JSON and Excel routes return 401. Production authenticated UI/save/download still require verification after deployment.

Publication: pending as of 22 October 2026. Netlify Free has paused production deploys due to credit usage. The Personal checkout is awaiting user payment; no purchase was completed by the agent. Preserve the pending corporate CC rollout and apply it only once its email worker is published.
