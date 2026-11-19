# Now — 「現在」頁 UI/UX

> Page-specific P0/P1 supplement to [UIUX.md](../UIUX.md) and [SHARED.md](./SHARED.md). **Purpose:** in seconds, answer “上一站／排定此刻／下一站／現在該看什麼？” without pretending to know the traveller's location.

## 1. Default content order

1. Trip identity, relevant source date/local timezone and a concise day title.
2. **Scheduled previous / scheduled now / scheduled next**: meaningful stop/activity name, published time (or explicit TBD), type and a quick link into the canonical Trip day/item. An item in the past is **not** proof of completion.
3. **Actionable reminders or risk** tied to that time/day, if source-backed: entrance cut-off, ticket, transfer, meeting place, time zone, last service caution or checked date. Hide empty panels.
4. Optional later items / **Flexible today / TBD** kept visible without assigning fake time. The full day's primary, unfurled timeline belongs to Trip; Now is a reading projection, not a replacement.

## 2. Temporal and truth semantics

- Effective timezone: `item.timezone` → `day.timezone` → `trip.timezone`, comparing absolute instants across country/day boundaries. Source-local display time stays intact. `TBD`/missing starts must **not** parse as `00:00` or current time.
- Label clearly **「排定此刻」/ Scheduled now**, not “你在這裡”, “已抵達”, GPS tracking, current transit position or confirmed actual activity. When the current time falls between items, show the appropriate surrounding planned items and an accurate gap, not a manufactured event.
- Today outside the published trip, a completed past trip, or no timed source item: show honest context and direct access to Trip/selected day, not fake “正在進行” cards. Date navigation must respect explicit deep links when the user chooses another trip day.
- Optional personal completion/checklist preferences are device-local and never advance itinerary time or claim a group decision.

## 3. Actions and presentation

- Prefer 1 clear handoff per visible item: open its Trip item, published destination in Maps, or a specialist official source when applicable. Do not generate a forest of large quick-action buttons.
- Compact vertical reading order on mobile; wide-desktop context rail shows relevant date/reminders rather than a second timeline. Avoid “what this card means” prose and repeating route or weather in three places.
- If sourced weather is shown, obey [WEATHER.md](./WEATHER.md) with accurate city/date and no second weather-date selector.
- No network service may block Now's published previous/now/next source timeline.

## 4. Acceptance

- Verify previous/now/next across midnight and Japan↔Taiwan timezone, `TBD`, future-only day, gap, past trip, offline, broken maps link, deep-link/Back, text zoom and long Japanese station names.
- Run `npm run test:uiux`, `npm run test:timeline`, relevant Now/timezone and browser suites. Do **not** label an unexecuted visual check PASS.
