# AGPLv3 license text and TREK provenance audit

Status: **PARTIAL / REVIEW REQUIRED** (2026-10-16). This file records evidence, not legal clearance or an assertion of new rights.

## Verified facts

1. The previous Travel Lite root `LICENSE` contained a 493-byte pointer/summary rather than the complete license text. This change replaces it with the **unaltered complete GNU AGPL version 3 text** from `liketrek/TREK/LICENSE`, which begins "GNU AFFERO GENERAL PUBLIC LICENSE / Version 3, 19 November 2007".
2. GitHub upstream `liketrek/TREK` reports `license.spdx_id: AGPL-3.0`; its full license is AGPLv3, and the commit dated 2026-03-19 changed its `LICENSE` from the initial MIT license to AGPL-3.0. See [upstream LICENSE](https://github.com/liketrek/TREK/blob/main/LICENSE), [upstream license history](https://github.com/liketrek/TREK/commits/main/LICENSE), and [upstream NOTICE](https://github.com/liketrek/TREK/blob/main/NOTICE.md).
3. Travel Lite has historically declared `AGPL-3.0-or-later` in source headers, `README.md`, and `AGENTS.md`; `NOTICE.md` identifies TREK as an upstream source of some adapted code. No conclusion about the precise file-level TREK-derived portion or a specific grant of "or later" follows solely from those repository labels.

## Unresolved — do not misreport as completed

- [ ] Compare the actual copied/adapted Travel Lite source files with relevant **dated TREK commit(s)**, not only its current `main`. Identify the corresponding original files, authors, original copyright/SPDX notices, modifications and dates.
- [ ] Establish whether each reused TREK portion offers AGPL-3.0-only or an explicit AGPL-3.0-or-later grant in its relevant historical headers, original copyright terms or a separate permission. A repository badge alone is insufficient.
- [ ] Restore/preserve any required upstream notices and modification notices for **identified reused files**. Keep third-party data notices only for third-party content genuinely included or reused; do not blindly copy irrelevant TREK data asset attributions.
- [ ] After review, decide accurate whole-work and per-file SPDX labels. If any portion allows only AGPL-3.0, avoid representing that portion as automatically eligible for later versions without an applicable grant. Do not silently change license terms as a substitute for rights verification.
- [ ] After merge, check GitHub's reported `license.spdx_id`; expected detection is a hypothesis until independently checked on deployed `main`.

## Use and reuse

The GNU AGPL permits commercial use when its applicable conditions are satisfied. It does not prohibit all embedding/integration or automatically cover unrelated programs merely communicating with this work. This audit adds **no** restrictions beyond the applicable license and makes **no** promise that the pending provenance questions have been resolved.

The full license is the `LICENSE` document, not this summary. If uncertainty affects a proposed redistribution, obtain appropriate licensing review before representing the rights as settled.
