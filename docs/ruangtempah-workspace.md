# TI Properties booking workspace

The RuangTempah public hotel profile and admin demo were inspected as a layout reference. TI Properties branding, data, booking rules and hosting are retained. No RuangTempah subscription, trial, reviews or sample data are copied into this portal.

- Public profile: 7 room/accommodation options, categories, destination search, official photos, menu links, booking steps and FAQ.
- Admin overview: current operational booking counts, latest requests, active spaces now, upcoming events.
- Approvals: `/admin/bookings`; quotes and historical financial reports remain separate.
- Calendar: `/admin/calendar`, daily timeline and seven-day view. Only confirmed/completed records occupy space; pending/quoted requests are tentative.
- Counter bookings: `/admin/walk-in`, admin-only, explicit customer consent and idempotent request ID. The transaction inserts pending and then confirms atomically when requested. Database overlap and VVIP capacity guards apply. E-mail verification is not fabricated. Confirmation e-mail follows the existing queue/settings. No online payment is taken.
- Operational analytics excludes imported financial report history. Financial history remains in `/admin/reports`.
- Apply `docs/admin-walk-in.sql` before publication. RPC access is restricted to service_role; the HTTP endpoint verifies the current admin and same-origin request first.
- Google Analytics is unconfigured until a valid `NEXT_PUBLIC_GA_MEASUREMENT_ID` is supplied. Optional consent is required before loading Google scripts; private paths disable collection. Configure the GA4 property with enhanced measurement disabled so only manually emitted page views are collected. Do not enable automatic form, history or outbound-link collection that can include private parameters. No advertising signals are enabled.
- Public sitemap/robots/metadata are supplied. Admin and private customer links remain excluded from indexing. SEO does not promise ranking.
