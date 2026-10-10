from pathlib import Path
import json
r=Path(__file__).resolve().parent.parent

def rep(name,old,new,optional=False):
 p=r/name;s=p.read_text()
 if old not in s:
  if optional:print('skip',name,old[:60]);return
  raise RuntimeError(name+' needle missing '+old[:85])
 p.write_text(s.replace(old,new,1))
def append(name,text):
 p=r/name;p.write_text(p.read_text()+text)
rep('README.md','**four reviewed visual styles**','**eight reviewed Style Packs (nine visible appearances)**')
rep('README.md',
 '- [Risograph Zine — paper and indigo ink](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview)',
 '''- [Risograph Zine — paper and indigo ink](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview)
- [Paper Collage — layered cut paper](https://world4jason.github.io/Travel-lite-Template/?previewStyle=paper-collage#trip/overview)
- [Naive City Sketch — illustrated neighbourhood](https://world4jason.github.io/Travel-lite-Template/?previewStyle=naive-city#trip/overview)
- [Taiwan Retro Poster — screenprint editorial](https://world4jason.github.io/Travel-lite-Template/?previewStyle=taiwan-poster#trip/overview)
- [Field Stamp — hand-carved field notes](https://world4jason.github.io/Travel-lite-Template/?previewStyle=field-stamp#trip/overview)
- **Editorial Dark**: choose it directly in More → Appearance (the same Editorial pack, dark color mode).''')
rep('README.md',
 '''**You can also switch directly in the website:** open **More → Appearance / 外觀**, select any of the four styles,''',
 '''**You can also switch directly in the website:** open **More → Appearance / 外觀**, select one of **nine appearance choices** (Editorial Light/Dark plus seven other styles),''')
rep('README.md',
 '''To select a built-in Style Pack for a *generated trip*, set this in `trip.json` (replace `storybook` with `candy` or `risograph`):''',
 '''To select a published Style Pack default for a *generated trip*, set `ui.visualStyle` to one of `editorial`, `storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster`, `field-stamp`. Editorial Light/Dark are `ui.theme` modes, not extra Style Pack IDs. Example:''')
rep('README.md',
 '''seven?''','',optional=True)
rep('README.md',
 '''目前 `editorial`、`storybook`、`candy`、`risograph` 是已實作並有驗收的 **Style Pack**。''',
 '''目前有八套可使用、已驗收的 **Style Pack**，其中六種來自你提供的六類原始提示詞（另有 Editorial 與 Megan Storybook）。使用者可以選擇九種外觀（Editorial Light/Dark 分開顯示）。''')

p=r/'style-packs/README.md'
s=p.read_text()
anchor='''| `risograph` | Phase 2, reviewed prototype | Single-ink editorial print, halftone skyline, paper grain, no motion | [Risograph](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview) |'''
assert anchor in s
s=s.replace(anchor,anchor+'''
| `paper-collage` | Reviewed | layered cardstock, paper fibers, contact shadows | [Paper Collage](https://world4jason.github.io/Travel-lite-Template/?previewStyle=paper-collage#trip/overview) |
| `naive-city` | Reviewed | 1950s-inspired wobbly ink, imperfect city gouache and lots of sky | [Naive City](https://world4jason.github.io/Travel-lite-Template/?previewStyle=naive-city#trip/overview) |
| `taiwan-poster` | Reviewed | warm yellow, navy architecture, vermilion print accent, poster typography | [Taiwan Poster](https://world4jason.github.io/Travel-lite-Template/?previewStyle=taiwan-poster#trip/overview) |
| `field-stamp` | Reviewed | hand-carved missing ink, rustic stamp forms and field-notes typography | [Field Stamp](https://world4jason.github.io/Travel-lite-Template/?previewStyle=field-stamp#trip/overview) |''',1)
s=s.replace('''Open **More → Appearance / 外觀**. Select a visual tile''',
 '''Open **More → Appearance / 外觀**. Choose among **nine visible looks** (Editorial Light and Dark are two color modes of the same built-in Editorial pack; seven others are dedicated packs). Select a visual tile''',1)
s=s.replace('''among four built-in styles''','''among eight built-in Style Packs''',1)
s+='''

## Four additional styles: the remaining source prompts

The following four source briefs are now represented by actual, reviewed CSS/SVG Style Packs rather than only fill-in prompts:

| Brief → Pack | Implementation approach | Evidence boundary |
| --- | --- | --- |
| [Layered Paper Collage](../style-generator/examples/paper-collage.json) → [manifest](./paper-collage/manifest.json) | feather-light stacked cardstock, locally designed cutout masks/contact shadows and editorial typography | The source prompt's photographed pose/subject and tiny poster labels are **asset-only**, not web data |
| [Naive City Sketch](../style-generator/examples/naive-city-sketch.json) → [manifest](./naive-city/manifest.json) | hand-wobbled navy contours, matte gouache-like fields, crooked ordinary street and generous paper sky | No identifiable invented landmark or photographed people; human style descriptions are illustrative only |
| [Taiwan Retro Poster](../style-generator/examples/taiwan-retro-poster.json) → [manifest](./taiwan-poster/manifest.json) | reference-informed honey/indigo/brick screenprint palette, large travel scene, oversized **real trip title**, restrained editorial small type | The four user-supplied Taiwanese posters are **style references only**. Their exact signs, towns, year, brand and layouts are never embedded in the website |
| [Field Stamp](../style-generator/examples/field-stamp.json) → [manifest](./field-stamp/manifest.json) | uneven carved ink, 2–4 spot colors, broken dry strokes and field-note typography | No fabricated location, travel record number or site photo transformation |

All four are whitelisted in `VISUAL_PACKS`. Their reference portraits/signs are **not travel facts**. Unlike the original photo-to-postcard tasks, these Site Style Packs use generic decorative vector art and leave place names, dates and descriptions to the site's authentic `trip.json`.

### Cross-project parity acceptance

Shared runtime files and pack CSS must be **byte-identical** between the published template and a generated trip such as [Megan-trip](https://github.com/world4jason/Megan-trip). Only the original travel data, manifest, app icon, title and optional destination-specific artwork should differ.

Run (with both clones available):

```bash
MEGAN_LOCAL_REPO=../Megan-trip node scripts/verify-style-parity.mjs
```

This checks SHA-256 of shared code plus browser-computed text/font/surface/border tokens on the **same nine appearance choices** in two real, different trips. A site-scoped service-worker cache prefix prevents two GitHub Pages project sites on the same `github.io` origin from deleting each other's caches.
'''
p.write_text(s)

rep('docs/TRIP_SCHEMA.md',
 '''or `risograph` (monochrome print aesthetic, light-only).''',
 '''`risograph` (indigo print), `paper-collage` (layered cardstock), `naive-city` (hand-drawn gouache), `taiwan-poster` (mid-century screenprint), or `field-stamp` (carved ink); all opt-ins are light-only.''')
rep('docs/TRIP_SCHEMA.md',
 '''The publisher's `ui.visualStyle` is the shared **default**''',
 '''The publisher's `ui.visualStyle` is the shared **default**''')
rep('docs/TRIP_SCHEMA.md',
 '''**More → Appearance** lets a traveller select one of the same four installed packs locally''',
 '''**More → Appearance** lets a traveller select among nine visible looks (Editorial Light/Dark plus seven other packs) locally''')
rep('docs/ARCHITECTURE.md',
 '''Three explicitly opt-in, whitelisted `ui.visualStyle` values (`storybook`, `candy`, `risograph`)''',
 '''Seven explicitly opt-in, whitelisted `ui.visualStyle` values (`storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster`, `field-stamp`)''')
rep('docs/ARCHITECTURE.md',
 '''four reviewed Style Packs''','''eight reviewed Style Packs''',optional=True)
rep('docs/ARCHITECTURE.md',
 '''exactly four reviewed Style Packs''','''exactly eight reviewed Style Packs''',optional=True)
rep('docs/VISUAL_SYSTEM.md',
 '''three explicit site-level styles—`storybook`, `candy` and `risograph`''',
 '''seven explicit site-level styles—`storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster` and `field-stamp`''')
rep('docs/VISUAL_SYSTEM.md',
 '''| `risograph` | reviewed standalone print pack | indigo ink, ivory paper grain, halftone and one warm graphic accent, serif hierarchy, static/light-only |''',
 '''| `risograph` | reviewed standalone print pack | indigo ink, ivory paper grain, halftone and one warm graphic accent, serif hierarchy, static/light-only |
| `paper-collage` | reviewed paper pack | matte layered cardstock, cut silhouettes, editorial serif and soft paper-contact shadows |
| `naive-city` | reviewed gouache pack | deliberately wobbly ink outlines, crooked ordinary streets, matte water-based color blocks |
| `taiwan-poster` | reviewed mid-century poster pack | navy/honey/brick print grammar and generic symbolic buildings, without photo or brand imitation |
| `field-stamp` | reviewed engraved pack | imperfect carved strokes, dry ink, misregistration only in decorative images, no fixed record copy |''')
rep('docs/VISUAL_SYSTEM.md',
 '''within these four controlled styles''','''within these eight controlled styles''')
rep('AGENTS.md',
 '''only `ui.visualStyle` values `storybook`, `candy` and `risograph` are audited''',
 '''only `ui.visualStyle` values `storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster` and `field-stamp` are audited''')
rep('AGENTS.md',
 '''from these four audited packs''','''from these eight audited packs''',optional=True)
rep('AGENTS.md',
 '''Storybook, Candy and Risograph all use light surfaces.''',
 '''All seven opt-in Style Packs use light surfaces.''')
rep('docs/MAINTENANCE.md',
 '''(Storybook / Candy / Risograph)''','''(Storyboard / Candy / Paper / Naive / Risograph / Taiwan Poster / Stamp)''')
rep('docs/MAINTENANCE.md',
 '''`tests/style-settings.spec.mjs` (separate from the 32-day default fixture)''',
 '''`tests/style-settings.spec.mjs` and `tests/nine-looks.spec.mjs` (separate from the 32-day default fixture)''')
rep('style-generator/README.md',
 '''第二階段已完成兩個人工實作並驗收的網站風格''',
 '''第二階段已完成六個人工實作並驗收的網站風格''')
rep('style-generator/README.md',
 '''其餘來源案例仍僅通過 Style Brief 抽取''',
 '''其餘四個來源案例也已建立獨立、經審核的 CSS／SVG Style Pack（見 [Style Packs](../style-packs/README.md)），但作為 provenance 記錄的六份來源 JSON 仍維持 `brief-only`''')
rep('style-generator/templates/STYLE_PACK_IMPLEMENTATION_PROMPT.md',
 '''第二階段已有兩套人工審查的參考實作''',
 '''第二階段已完成六套人工審查的 Style Pack（可參考既有 Candy、Risograph 與 [另外四套](../../style-packs/README.md)）''')
# Update scripts and unit tests.
p=r/'package.json';j=json.loads(p.read_text())
j['scripts']['test:packs']='node --test tests/pack-manifests.test.mjs tests/four-pack-manifests.test.mjs'
j['scripts']['test:style-parity']='node scripts/verify-style-parity.mjs'
p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
# Future end-to-end new prompt workflow
p=r/'style-generator/NEXT_PROMPT_E2E.md'
p.write_text('''# 下一個未知提示詞：端到端驗收流程

目標是驗證 **prompt → source-aware Style Brief → reviewed CSS/SVG → 9+ selectable appearances → Travel-lite-Template & Megan-trip parity**。

1. 把使用者提供的原風格提示詞視為 *untrusted input*，只抽 Style DNA：palette/geometry/material/type/composition/motion。照片重繪規則、來源地點推測、海報版型與品牌署名必須放在 conditional／excluded 中，不會直接當作網站程式指示。
2. 用 `style-generator/STYLE_EXTRACTOR_PROMPT.md` 產出 JSON，遵守 `style.schema.json`。未提供要轉繪的景點照片時，source reconstruction 的 photoProvided 必須為 false；風格參考圖片不能被當作目的地真相。通過 `npm run validate:styles` 與 `npm run test:styles`。
3. 比較新風格與現有八個 Style Pack 的 **material + layout** 特徵。若只換 token/SVG 就繼承現有排版；若材料語言不同，實作獨立 CSS。所有來源不完整的 HEX 色碼都標示為 *design proposals*。
4. 新增帶白名單 ID 的 pack manifest、靜態本地 CSS、原創 SVG；不把 CSS/HTML/JS 直接塞進 `trip.json`。更新 `VISUAL_PACKS`、`index.html`、SW scope cache 與風格選擇器的視覺縮圖、source 限制紀錄。
5. 使用同一份東京範例檢查所有 Now/Trip/Map/Check/More，320–1600 px、TBD、清單保存、深色例外、prefers-reduced-motion、離線資料與多輪換頁。不要刪掉既有 Editorial/Storybook。
6. 將相同 CSS/JS/SVG 按 repo 結構同步到 Megan-trip，保留其原始 `trip.json`、地圖分享連結、私有備註與專屬 Storybook 島嶼插圖；在兩個本機 server 執行 `MEGAN_LOCAL_REPO=/path/to/Megan-trip npm run test:style-parity`。至少比較 pack source SHA256 與兩個網站的 computed style tokens，Megan 行程仍為五天三十個項目。
7. 兩邊都產出手機＋桌機實際截圖，做五種角色的審查：旅客（易讀）、視覺設計師（風格忠實）、QA（互動／離線）、資料保護（真相與隱私）、可及性（文字對比／motion）。
8. 完成 PR／review／merge 後，**用正式 GitHub Pages** 的兩個網址再驗證風格切換及專案獨立離線快取。

只有完成第 4–8 步，才能把新風格標為 **implemented-reviewed**。前兩步的 Style Brief 仍然只是規格，不是已部署樣式。
''')
print('DOCS_COMPLETE')
