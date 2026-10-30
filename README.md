# Nile & Fern

A premium Uganda travel website and installable PWA, created as the business demo for Nile AI Solutions’ Black November campaign. Nile & Fern is a fictional travel company. No real booking, permit, payment or automatic email is created.

## Run locally

Use Node 24 and the pinned dependencies:

```sh
npm ci
npm run dev
```

`npm run build` checks TypeScript, prepares the production build and versions the public PWA cache. `npm test` checks enquiry validation and CSV export safety.

## Public website

- A responsive homepage, working destination dropdown, site search and mobile navigation.
- Six Uganda destination guides and six full sample itineraries.
- Journey filtering by style and duration, text search and downloadable itinerary PDFs.
- Saved journeys and a comparison table stored on the current device.
- A four-step trip planner with local preference drafts; contact fields are not persisted in browser storage.
- A connected general enquiry form, private reference/code receipt and enquiry tracking page.
- Three original field notes, searchable FAQs, company story, privacy page and photo credits.
- An installable PWA with public asset/page caching and offline messaging.
- Ask Fern is a clearly marked assistant preview. It does not call an AI provider or send chat messages.

## Operator studio

`/operator-studio` offers a practice workspace with fictional device-local records and a connected workspace for assigned staff. It supports search, status filtering, public progress summaries, private notes and CSV export. Exported text is protected against spreadsheet formula interpretation.

The connected workspace uses the existing verified Nile Core account for `opiotitus333@gmail.com`. No password was created, changed or exposed. Login requires that account’s existing email/password credentials and an explicit `nft_staff` membership. Sessions are kept in page memory; reload signs out. A Google button is not exposed because this new domain has no configured OAuth callback.

## Backend

The existing Nile Core Supabase project is used with isolated tables: `nft_staff`, `nft_enquiries`, `nft_intake_limits`. The app does not read or write the school demo’s tables. All new tables have RLS. Anonymous visitors have no direct enquiry read/write privileges, and authenticated users require app-specific staff membership to read records or update workflow fields.

Public writes and tracking go through the `nile-fern-intake` Edge Function. It validates requests, limits streamed bodies to 32 KB, checks a honeypot and applies an atomic database rate limit. It issues a random reference and 64-character private code; only a SHA-256 code hash is stored. Tracking returns status fields without contact details or private notes. The function retains JWT verification and uses its server-side service-role environment variable; no service-role secret is present in the frontend or source bundle.

`src/config.ts` contains only public Supabase connection values, with optional Vite environment overrides. The domain validator is copied into the Edge Function by `scripts/sync-domain.mjs` so source validation remains consistent. The recorded database setup is in `database/schema.sql`.

## Deploy

Canonical source: https://github.com/tytuso/nile-and-fern. The existing Vercel project is `nile-and-fern`, ID `prj_doLSVZ2AGE6lOku4cfhRwkVP4mAj`, on the same team as the school showcase. Build with `npm run build`, output `dist`. Preserve this project and its public URL when updating source or Git settings.

Before deploying this template as an operating business, replace the fictional identity and sample content with approved company details, real booking terms and verified travel arrangements. Current destination/entry requirements should be checked with the relevant authority and operating provider.

## Photography

Eight real Uganda photographs are licensed from Unsplash. See `ASSET-CREDITS.md` and `public/images/credits.json`. Images are illustrative of destinations, with no claim of ownership or partnerships. No AI-generated imagery is used in this travel website.

## Verification

- Production build and 10 validation/export tests pass.
- Browser checks cover destination navigation, filtering, saving/comparing trips, itinerary expansion, the trip planner, receipt download, private tracking and mobile practice operator updates.
- Phone and tablet views were checked for horizontal overflow.
- A synthetic enquiry was saved through the browser, verified in the database, updated under the assigned staff role and checked through the private public tracking flow.
- Anonymous enquiry reads and limiter-function execution are denied. No new Supabase security advisory referenced the app’s tables.
- The PWA manifest and cache preparation are checked by the build. Native installation has not been performed on a physical phone.

`qa/`, local dependencies, production build output and the responsive QA helper are excluded from the deliverable source and production deployment.

## Black November design revision

The showcase now has an independent visual identity for each category, including a persistent dark/light theme switch. Theme preference is stored only in this browser. Navigation, content and existing demo interactions remain available. No new database setup is required for this design revision.
