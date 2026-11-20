# Independent Overview Cover Verification — v1

This is a **release gate** for the Template and generated trips. It is deliberately independent of the image generator, offline, reproducible and fail-closed. Existing Cover Atlas (5×3) is a useful **low-resolution illustration preview**, **not** sufficient evidence of fifteen independent full-resolution covers.

## Non-negotiable distinction

1. **Repeatable process:** versioned inputs, selected source IDs, one independent image request per Style Pack, fixed image size/model snapshot, file hashes, image receipts, independent visual evaluator and explicit human approval.
2. **Not bitwise reproducibility:** image generation is stochastic. The same prompt may produce different pixels. The gate ensures each run produces **auditable candidate evidence** and rejects candidates below standards; it cannot promise identical artwork.
3. **Independent quality:** do not let the generator self-declare quality. The evaluation script has a separate implementation from the generator. Its visual assessment uses a separately invoked model that has **not seen the generation prompt** and finally a human reviewer. A model score is evidence, not a guarantee of truth.

## Generation and QA workflow

### 1. Publisher chooses the actual trip memories

Use `tools/overview-artwork-picker.html` to select the real itinerary IDs (including events and breaks). It exports the artwork brief; do not derive subjects from famous tourist spots. All 15 covers must use the same selected subjects. This field is currently `trip.overviewArtwork.subjectIds`.

### 2. Freeze recipes and issue individual generation jobs

`npm run artwork:prepare` writes `artwork/generation/cover-jobs.json` using the **versioned 15 distinct style recipes** in `artwork/quality/cover-recipes.v1.json`. Each job includes original source ID snapshots, a different style-specific medium/composition/must/avoid prompt, fixed model snapshot, native `1536×864` target, `promptSHA256`, `requestSHA256`, and `recipeSHA256`. The generator MUST run **one image-generation API request per style**. No 3×5 composite request or prompt-inferred design shortcuts. The generator will refuse to overwrite an existing source asset: retry is a separately audited candidate, not an untraceable replacement.

The sample CLI uses OpenAI's documented Image API generation endpoint. To actually request billable images, the publisher manually supplies `OPENAI_API_KEY` and runs:

    node tools/artwork/generate-covers.mjs --execute

No API key in GitHub or GitHub Pages. The API stores original full-resolution `artwork/generated/<style>.webp` and `artwork/generation/receipts/<style>.json`. Keep source images and receipts available to independent verifiers, even if public images are optimized separately.

### 3. Independently judge actual pixels

The separately implemented `tools/artwork/judge-covers.mjs` reads the **image, fixed style rubric and scene facts**, but **not** generation prompts or generator self-scores. It uses a separately configured vision model and strict JSON output. Invoke with explicit consent to the API cost:

    node tools/artwork/judge-covers.mjs --execute

The scorecard (1–5) has **styleMatch, composition, sceneClarity, sceneFidelity**; requires all four independently identified memories (fireworks, yokai procession, Kumano Kodo, coastal cave onsen), no invented readable text, and no misleading implication of a documentary simultaneous scene. Each dimension must be ≥4; averaging does not hide a failed dimension. Save individual model response IDs and the SHA-256 of the image assessed. If a model is uncertain, it should score conservatively, not assert made-up source fidelity. Visual model judgment must be calibrated against independent human decisions for any production QA claims.

### 4. Human reviewer verifies the *actual native file*

A human checks full-resolution detail, typography artifacts, prohibited visual styles, cultural/venue fidelity, source-photo rights, and legibility when cropped at 320/390/1100/1920px. The separate `artwork/reviews/human/<style>.json` file records reviewer, UTC timestamp, image SHA, `approved=true`, rights-checked flag and notes. The generator is **never** allowed to auto-populate this approval. Any failure or mismatch sends only that style back to generation/review.

### 5. Fail-closed technical and provenance QA

Install Pillow once if missing: `python3 -m pip install Pillow` (pinned appropriately for production environment). The verifier uses independent Python + Pillow, not the generator JavaScript:

    npm run artwork:verify

It requires an `artwork/quality/cover-output-manifest.json` mapping exactly 15 distinct styles to separately stored native source and optimized published images. For each, it checks real decoded image resolution, 15 unique native file hashes, path safety, `1536×864` minimum native source, published ≥`960×405`, full file SHA verification, matching request/receipt hashes, independent model assessment and explicit human approval. **Atlas crops, contact sheets, fake native sizes, old visual assessments, missing receipts, low per-dimension scores, missing memories or missing human sign-off all fail or remain PENDING.** Exit 0 only when ALL 15 are `PASS`; FAIL=2, PENDING=3. Reports are emitted as machine-readable JSON and are not hidden by CI.

To audit the current legacy cover images without claiming independent generation:

    npm run artwork:verify:legacy

That is **expected to fail**: 13 of 15 were extracted from a 3×5 contact sheet; original separate generation receipts and independent reviews are missing. Do not relabel cropped assets as originals merely to bypass the gate.

### 6. Publishing must call the verifier again

`npm run artwork:publish` is **dry-run by default** and executes the external verifier itself. Only after 15/15 PASS can the author explicitly run:

    node tools/artwork/publish-approved-covers.mjs --execute --revision <new-revision>

It atomically updates the published `trip.overviewArtwork.images` only with the independently verified individual assets. Never release merely because the publisher script or display-time JS says the image is present. Commit source recipes, job hashes, receipts, approved images, separate review records and JSON report together (the original image artifacts may be held in a private/provenance location if too large, but then provide independently resolvable hashes and references). **No GitHub Actions are required; manual release still requires a human.**

## Evidence audit and negative control tests

`npm run test:artwork-verify` runs synthetic tests for deliberate problems: atlas crop, low native resolution, duplicate images, missing generation receipt, stale reviews, absent/low judge evidence, missing human approval, invalid source item IDs, and fewer than fifteen styles. These fixture results are *tests of the verifier*, not a claim that the actual travel covers passed. Reviewers can rerun the verification tool with a different machine or model; no trusted generator state is required.

Reference documentation: [OpenAI Image API](https://developers.openai.com/api/docs/guides/image-generation), [Vision inputs](https://developers.openai.com/api/docs/guides/images-vision), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).