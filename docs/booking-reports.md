# Elysium Hall booking reports

Route: `/admin/reports`. Admin authentication is required for both JSON and XLSX APIs. No workbook or financial data is published in public assets.

The 14 columns follow the user's 2026 monthly workbook layout. Following explicit user authorization, historical source rows are imported into the private report archive. Budgets and source summary formulas are not imported as booking rows. Excel exports contain the selected month or all 12 months of the selected year.

- Report reads Elysium Hall bookings by event date, with pagination and deterministic ordering. Gallery/tour bookings are excluded.
- Dashboard refreshes every 30 seconds while visible and on focus. Downloads query the database again. Downloaded files are snapshots; they do not update themselves.
- confirmed/completed → CONFIRM; pending/quoted/awaiting_payment → TENTATIVE; cancelled/rejected → CANCEL.
- Admin uses Edit to enter the agreed quotation gross amount, applicable SST percentage, sector CODE, payment method, sales person, operations PIC and remarks. Customer budget is never treated as agreed revenue. PDF uploads are not parsed to guess amounts.
- Blank amount or tax rate remains unknown; an entered zero is preserved. Totals exclude unknown amounts and display a missing count. Confirmed tax/net totals are withheld in the export if inputs are incomplete. SST is calculated per booking, rounded to cents, using the admin-entered rate rather than the template's old fixed 6% formula.
- Revenue totals represent quotation value by booking status, not payment receipts or accounting revenue recognition.
- Spreadsheet customer text is written as literal strings, not formula cells. Only application-generated total cells are formulas.
- No budget/variance values are invented. Source template budgets require a separately agreed process before being added.

Historical import uses `docs/booking-history-schema.sql` and an untracked private import script/data file. Never commit customer workbook contents, private import SQL or financial source records to GitHub. The archive is server-only with RLS and revoked client grants. Rows retain sheet/row provenance, all three original monetary columns and original remarks. Blank serial numbers are accepted when a dated source row has event details or an amount. Four source rows with missing/zero group names are retained and flagged; two identical unnamed source rows are preserved separately as in the workbook, not silently merged. Original non-Elysium Drawbridge venues are preserved as listed. Two source date typos were corrected with explicit user confirmation; correction notes are retained per row. No SST rate is guessed from old template formulas.

The source contains 186 records across all 12 months of 2026. Import is idempotent by source key + sheet + row, with saved-content reconciliation and an exact date/organisation/event/pax collision check against portal bookings. Importing creates no actual booking, email, calendar block or TIP quotation number. Historical rows are read-only in the dashboard; source corrections follow a reviewed import process. Current portal bookings retain their normal editable report fields.

Database setup: `docs/booking-report-rollout.sql`, additive table with RLS and no anon/authenticated grants. Server-only API checks the existing admin registry before using the service role. Setup applied and checked 22 October 2026: RLS true, public/client read false, service access true, no report records created during setup.

Validation: 27 unit/export tests and TypeScript pass. Live local unauthenticated JSON and Excel routes return 401. Production authenticated UI/save/download still require verification after deployment.

Publication: Netlify Personal was activated by the user. Reports and corporate CC notifications are live. Historical import support is the next additive update. Source customer data stays only in the private database, never in this repository.

