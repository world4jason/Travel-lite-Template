# Acceptance checklist

Travel Lite base-template acceptance after runtime discovery removal.

- [ ] `trip.json` and `manifest.webmanifest` parse as valid JSON.
- [ ] All local JavaScript passes syntax checking.
- [ ] No Photon, Overpass, Wikipedia/Wikidata runtime fetch code remains.
- [ ] `Now` still provides current/next, reminders, shared TBD summary, and weather when available.
- [ ] `Trip` stays read-focused and renders handoff links, Google Maps query links, decisions, and static info cards.
- [ ] `Map` shows only already-planned stops and retains Google Maps handoff if MapLibre fails.
- [ ] `Check` keeps checklist/todo state device-local in IndexedDB with localStorage fallback.
- [ ] Shared TBDs cannot be resolved locally; only `decision.mode: personal` writes a personal preference.
- [ ] `More` remains read/reference oriented.
- [ ] Service worker cache version is bumped so old discovery JavaScript is not kept as the active shell.
- [ ] Static GitHub Pages deployment remains build-free.
