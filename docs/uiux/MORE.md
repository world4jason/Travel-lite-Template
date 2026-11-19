# More — 「更多」頁 UI/UX

> Page-specific supplement to [UIUX.md](../UIUX.md), [SHARED.md](./SHARED.md), [Trip Schema](../TRIP_SCHEMA.md) and the existing read-only product scope. **More is preparation/reference/preferences, not an alternate itinerary, editor or sixth-tab launcher.**

## 1. Information hierarchy and section ownership

- Show **only populated sections**, in a clear scan order: traveller's checklists / current preparation tasks; source-backed ticket/admission or reference cards where supported; optional **Travel Essentials**; existing guide/links or saved references; personal appearance and device preferences. Do not fabricate an empty “travel guide” just because the template has a slot.
- Checklist is the canonical existing More destination (`#check` remains a supported legacy deep link). Respect device-local checked state; never imply it is shared across travellers or completed on their behalf.
- Travel Essentials are optional, read-only, collapsible **reusable** instructions: airport arrival, ticket usage, regional transit, intercity boarding. Require source-backed `title` and useful content; optional `category`, `dayDate`, `checkedAt` and `sourceLinks`. Day-specific risks belong to Trip/Now, A→B transitions to Transport/Trip, optional route alternatives to Plan B, not duplicated here.
- Tickets, reservations and admission data link via **explicit stable `itemId` / `itemIds`** to the actual item when the schema supports them; never guess by title or reveal private booking tokens/QR codes on the public site.
- Settings/Appearance: respect system/light/dark and installed, reviewed Style Packs, the publisher's trip default, and explicit temporary preview controls. Do not accept arbitrary CSS/remote style packs from `trip.json`. Changes affect this device only and do not alter source itinerary data.

## 2. Interaction and visual standards

- Prefer meaningful section titles, concise actionable rows, compact metadata. Optional reference bodies and source lists expand on request; do not show instructional filler or repeat product caveats in every subsection.
- Keep checkboxes, disclosures, link labels and preference controls keyboard-operable, visibly focused, accessible at 200% text and with practical ≥44px primary touch targets. Preserve local setting/checked state across refresh and offline.
- Wide desktop companion rail must show **More-relevant** quick context, not a second Trip timeline. Responsive cards follow shared 12px safe insets and all active Style Pack semantics.
- Unsupported or missing `essentials`/checklists must not render broken empty panels. Unknown external URL protocols are rejected; offline keeps saved reference data with clear unavailable outbound links.

## 3. Non-goals and privacy

- Not a planner, shared task manager, booking/payments app, upload vault, global account sync, live-ticket checker or weather dashboard. No sixth top-level destination.
- Published repository content is public; never embed passenger identification, booking numbers, passports, private traveller contacts or scanned ticket/boarding codes. Personal preference keys belong in device-only storage.

## 4. Acceptance

- Run `npm run test:uiux` and relevant local-state, checklist, styling, PWA/deep-link and 320/390/1100/1920px (200% text) browser tests.
- Exercise `#check` legacy path, checklists after reload, per-trip style override / “Follow trip default”, missing Essentials, offline reading and unsupported URL fallback. State **NOT RUN** when a browser suite was not executed.
