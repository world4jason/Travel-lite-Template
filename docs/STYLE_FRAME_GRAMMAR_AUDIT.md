# Frame & Ornament Grammar audit — all Travel Lite styles

2026-10-17 source/CSS audit. Only Vintage Watercolor changes visually in this PR; other style proposals require separate design approval.

## Border ≠ outline

Object outlines are described by Geometry. Frame Grammar separately documents page/chapter/card boundaries, inner/outer stroke, four-corner morphology, central separators, label frames, surface mapping, and responsive density. It is a style identity property, not a universal decorative overlay.

Web design references (independent from the private booklet):
- USWDS border token taxonomy: https://designsystem.digital.gov/utilities/border/
- MDN layered CSS backgrounds: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Backgrounds_and_borders/Using_multiple_backgrounds
- W3C decorative corner/border images: https://www.w3.org/WAI/tutorials/images/decorative/
- Risograph printing and registration practices: https://risottostudio.com/pages/advanced-print-setup

## Per-pack audit (existing CSS + prior brief, then proposed treatment)

| Style | Observed existing visual border language | Suitable frame grammar | Priority |
| --- | --- | --- | --- |
| Editorial | sparse section hairlines | semantic separators, avoid decoration | Existing is sufficient |
| Storybook | thick cartoon outline and rounded capsules | simple comic/story card frame | Existing is sufficient |
| Candy | highly rounded stickers with pastel outline | candy sticker contour, not gilding | Existing is sufficient |
| Risograph | spot-ink double rules and press grain | registration/crop ticks and rough print section rule | P2 candidate |
| Paper Collage | overlapping matte-paper surfaces/shadows | layered cut edge with offset, not Victorian border | P2 candidate |
| Naive City | asymmetric heavy hand-drawn frame | lively imperfect illustrated postcard contour | Existing is sufficient |
| Taiwan Poster | thick navy billboard/print slab borders | straight screenprinted framing | Existing is sufficient |
| Field Stamp | carved edge and dashed strokes | selectively distressed stamped rectangular seal | P2 candidate |
| Quiet Linocut | carved thin/dashed border | sparse engraved chapter divider | P3 candidate |
| Doodle Memory Grid | irregular pen/dashed outlines | local imperfect grid cell frames | Existing is sufficient |
| Crayon Journal | uneven solid borders and wobble | visible hand-pressed crayon edge | Existing is sufficient |
| Painterly Editorial | airy watercolor composition | no ornate border; very soft tinted wash edge at most | Do not add |
| Geometric Print | sharp polygon/rectangular bounds | cropped polygon corners, no scrollwork | Existing is sufficient |
| Quiet Acrylic | tiny fine-line detail and large blank paper | near-invisible hairline or none | Do not add |
| Vintage Watercolor | previously simple gold card edges | four botanical corners, inset inner rule, center flourish, framed label | IMPLEMENT |

This is a *style fit* comparison, not a claim that all missing patterns should be added. Existing pack source art must be independently reviewed before adding new border motifs.

## v1.1 extraction contract

New Style Briefs use schemaVersion 1.1.0 and explicitly provide frameAndOrnament. Old 1.0.0 briefs remain valid but do not prove the absence of frames. The new model stores role, line layers, corners, divider, badges, per-surface density, mobile/desktop/print fallback and evidence. role none is appropriate when a reviewed source demonstrably has no frame; role unknown means framing was not observable or not supplied. Do not infer absence from missing evidence or invent a botanical ornament to fill the schema.

Validation sequence: evidence from source → typed frame spec → original CSS/SVG mappings → mobile/desktop/print screenshots → accessible UI and core regression. No PDF image or text is copied into public repository assets.

## Intended acceptance

Run tests at 320, 390, 844, 1100. Inspect key identity and chapter surfaces, long CJK titles, unchanged trip facts and focus. Re-export A5 PDF and verify selectable text, dense multipage readability and offline startup. Release only after Agent code/visual QA; post-deployment Human Review stays pending until the owner checks the Pages site.
