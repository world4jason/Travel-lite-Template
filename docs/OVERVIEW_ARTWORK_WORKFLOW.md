# Optional Trip Overview Artwork — publisher workflow

This is **opt-in**, post-planning publishing work. It never becomes a prerequisite for a trip website, a 6th tab, an editable shared itinerary or a browser-hosted image model.

## 1. Choose what *matters* to the owner

Run the template with an HTTP server (for example `python3 -m http.server 8000` at the repository root) and open:

`http://localhost:8000/tools/overview-artwork-picker.html`

The standalone editor reads the existing `trip.json` and offers the itinerary's `place`, `event`, `break` and notable `stay` entries, **not just the Places directory**. Select 1–6 unique source moments and 1–3 desired images. Copy/download the offline brief.

Do **not** rank destinations from their city names, commercial popularity or automatically infer that a venue equals the traveler's most important memory. The owner explicitly selects the subjects.

## 2. Generate and review outside the browser

Use the existing published Style Pack art direction (material, geometry, palette, composition) as an **image-specific recipe**; do not blindly paste a website prompt into image generation. Photos supplied as references need verified rights and subject accuracy.

A combined memory montage is illustration, not a documentary photograph. Never imply fireworks, pilgrimage and hot springs happened at the same time/place. Require a human review of scene identity, attribution, aspect ratio, typography absence and safe source licensing.

Place accepted art in the **specific trip repository**, for example `assets/overview/my-trip.webp`. Multiple pack-specific alternatives may be produced, up to 48 bounded image entries; only 1–3 for the currently active pack are displayed. The default site does not generate art.

## 3. Connect the selected artwork to the published trip

```json
"overviewArtwork": {
  "subjectIds": ["true-item-id-1", "true-item-id-2"],
  "images": [
    {
      "src": "./assets/overview/my-trip.webp",
      "alt": "Illustration depicting two explicitly chosen journey memories",
      "styleId": "vintage-watercolor",
      "fit": "contain",
      "focalPoint": "center"
    }
  ]
}
```

Put this inside `trip` in `trip.json`, **not** in `ui` or `days[].items[]`. Subject IDs must exactly match current source `days[].items[].id`; `images` may be empty. A Style Pack-specific image shows only in the matching pack. To provide a fallback for other packs, supply a **source-accurate licensed photograph** without `styleId`; it does not get recolored at runtime. If neither exists, the existing no-art Overview remains.

Keep the 178px image height cap and Compact Overview P1.12. The 1–3 images must not reclassify events or breaks as Places, alter the chronological timeline, add template slogans, or mask the day list.

For multi-pack travel artwork, package 15 equally sized cover images into one 5×3 local AVIF atlas when useful and use the optional `atlasSlice` integer 0–14 in each style-specific image. This saves downloads and makes offline availability easier; verify the artwork crop under all appearances. Individual full-resolution files may still be kept as downloadable source assets for redesign or human selection.\n\n## 4. QA / release gate

Run `npm run test:overview-artwork`, `npm run test:overview`, `npm run test:uiux`, `npm run test:timeline`, `npm run lint:uiux`, `npm run test:overview:browser`, and relevant responsive/Style Pack checks. Review 320/390/1100/1920px with 200% text and missing/failed media; verify visible content after switching styles, browser history, PWA offline and asset delivery. GitHub Actions workflows were intentionally removed by publisher request; run the available Node and browser checks manually where a browser is available. **Do not claim full release QA** when these checks are not run. Separate PASS/FAIL/NOT RUN; manual aesthetic/subject review remains explicit.
