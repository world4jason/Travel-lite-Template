"""Generate six bounded site-level CSS Style Packs from reviewed Style Brief art direction.
Only statically registered IDs can load these files; source prompts never become
executable CSS. Re-run: python3 style-build/second-batch-css.py
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
P={
"quiet-linocut":{
"bg":"#F4EDDD","ink":"#253C51","muted":"#4E5A5E","surface":"#FAF6EB","alt":"#E8E9D9","accent":"#A0B4AE","detail":"#B87862","border":"2px dashed #253C51","radius":"2px","font":'Georgia, "Iowan Old Style", serif',"utility":'"Courier New", "Noto Sans TC", monospace',"mode":"stamp","section":"quiet"},
"doodle-memory-grid":{
"bg":"#FBF6EA","ink":"#514D51","muted":"#514D51","surface":"#FFFAF1","alt":"#F2E7D8","accent":"#E7C986","detail":"#A3C5D5","border":"2px dashed #514D51","radius":"17px 24px 15px 22px","font":'"Comic Sans MS", "Chalkboard SE", "Huninn", sans-serif',"utility":'"Huninn", "Noto Sans TC", system-ui, sans-serif',"mode":"doodle","section":"grid"},
"crayon-journal":{
"bg":"#FAF2E6","ink":"#53565D","muted":"#53565D","surface":"#FFF9ED","alt":"#F1DFCA","accent":"#D7AD69","detail":"#76AEB5","border":"2px solid #53565D","radius":"23px 13px 26px 17px","font":'"Comic Sans MS", "Chalkboard SE", "Huninn", sans-serif',"utility":'"Huninn", "Noto Sans TC", system-ui, sans-serif',"mode":"crayon","section":"horizontal"},
"painterly-editorial":{
"bg":"#F4F7F1","ink":"#304D64","muted":"#4F6673","surface":"#FCFCF7","alt":"#E0ECEE","accent":"#B5D2DE","detail":"#DBA6A0","border":"1px solid #B9CDD0","radius":"14px","font":'Georgia, "Iowan Old Style", serif',"utility":'"Noto Sans TC", system-ui, sans-serif',"mode":"paint","section":"brush"},
"geometric-print":{
"bg":"#F5F0E5","ink":"#334A62","muted":"#485A64","surface":"#FAF5E8","alt":"#DDE2D8","accent":"#95A99B","detail":"#C78B77","border":"1px solid #334A62","radius":"0","font":'"Arial Black", "Noto Sans TC", system-ui, sans-serif',"utility":'"Noto Sans TC", Arial, sans-serif',"mode":"poly","section":"geo"},
"quiet-acrylic":{
"bg":"#FCFAF3","ink":"#52615D","muted":"#52615D","surface":"#FFFCF7","alt":"#F2F1E8","accent":"#93B7AF","detail":"#D9A99C","border":"1px solid #CED6D0","radius":"2px","font":'Georgia, "Iowan Old Style", serif',"utility":'"Noto Sans TC", Arial, sans-serif',"mode":"acrylic","section":"space"},
}

for id,style in P.items():
    prefix=f':root[data-visual-style="{id}"]'
    root=prefix
    v=style
    out=f'''/* {id}: original, source-reviewed visual style. SPDX-License-Identifier: AGPL-3.0-or-later
 * Derived from text-only Style Brief; no original travel photo was supplied.
 * Do not copy 3:4, photo-preservation instructions, invented captions or slogans.
 * The main SVG is decorative and is not a source for actual trip facts. */
{root} {{
 --paper:{v["bg"]}; --ink:{v["ink"]}; --muted-ink:{v["muted"]};
 --bg:{v["bg"]}; --bg-top:{v["bg"]}; --surface:{v["surface"]};
 --surface-2:{v["alt"]}; --text:{v["ink"]}; --muted:{v["muted"]};
 --line:{v["ink"]}; --accent:{v["ink"]} !important;
 --accent-soft:{v["accent"]}; --coral:{v["detail"]};
 --yamabuki:{v["accent"]}; --water:{v["accent"]}; --bamboo:{v["alt"]};
 --radius-lg:{v["radius"]}; --radius-md:{v["radius"]};
 --font-display:{v["font"]}; --font-utility:{v["utility"]};
 --shadow:none; --shadow-float:none; color-scheme:light;
}}
{root} body {{
 background:{v["bg"]} !important;
 background-image:none !important;
 color:{v["ink"]}; font-family:var(--font-utility);
}}
{root} :is(h1,h2,h3,h4) {{
 color:{v["ink"]}; font-family:var(--font-display);
 letter-spacing:-.018em;line-height:1.21; font-weight:700;
}}
{root} .eyebrow {{
 color:{v["muted"]}; font-size:.73rem;
 letter-spacing:.10em; text-transform:uppercase;
}}
{root} :is(.trip-header,.trip-overview-hero,.trip-overview-day,
 .trip-highlight-card,.trip-open-decision,.trip-route-summary,
 .trip-day-view > .day-summary,.trip-v2-timeline .trip-v2-item,
 .panel,.runtime-map-panel,.companion-window-card,.companion-focus,
 .shell-context-slot,.bottom-nav) {{
 background:{v["surface"]}; border:{v["border"]};
 border-radius:{v["radius"]}; box-shadow:none!important; color:{v["ink"]};
}}
{root} .trip-header {{
 background:{v["surface"]};padding:17px 21px;
}}
{root} #trip-location {{
 background:{v["accent"]};color:{v["ink"]};
 border:1px solid {v["ink"]}; border-radius:{v["radius"]};
 padding:4px 9px;font-size:.74rem;
}}
{root} #trip-title {{
 font:700 clamp(1.65rem,4vw,2.7rem)/1.12 var(--font-display);
}}
{root} .trip-meta {{color:{v["muted"]};}}
{root} .live-time {{
 background:{v["alt"]};color:{v["ink"]};
 border:{v["border"]};border-radius:{v["radius"]};
}}
{root} .live-time small {{color:{v["muted"]};}}
{root} .trip-overview-hero {{
 display:grid;min-height:0;gap:8px;
 grid-template-columns:minmax(0,1fr);
 grid-template-areas:"eyebrow" "title" "subtitle" "art" "stats";
 padding:21px 20px;
 background:{v["surface"]};
}}
{root} .trip-overview-hero > .eyebrow {{grid-area:eyebrow;margin:0;}}
{root} .trip-overview-hero > h2 {{
 grid-area:title;max-width:100%;min-width:0;
 font:700 clamp(2rem,4.8vw,3.65rem)/1.11 var(--font-display);
 margin:0;overflow-wrap:anywhere;
}}
{root} .trip-overview-hero > p:last-of-type {{
 grid-area:subtitle;max-width:100%;color:{v["muted"]};
 font-size:.82rem;line-height:1.5;
}}
{root} .trip-overview-hero::after {{
 content:""; grid-area:art;display:block;
 width:100%;height:auto; aspect-ratio:760/430;
 background:url("./assets/{id}/hero.svg") center/contain no-repeat;
 min-width:0;margin:7px 0 0;align-self:end;
 animation:none;pointer-events:none;
}}
{root} .trip-overview-stats {{
 grid-area:stats;display:flex;flex-wrap:wrap;gap:8px;
 border-top:1px solid {v["muted"]};padding-top:12px;
 margin-top:9px;width:100%;
}}
{root} .trip-overview-stats span {{
 padding:5px 9px;background:{v["alt"]};
 border:1px solid {v["ink"]};border-radius:{v["radius"]};
 color:{v["ink"]};font-size:.75rem;
}}
{root} .trip-overview-stats strong {{color:{v["ink"]};}}
{root} .trip-overview-day {{
 position:relative;min-height:132px;
 border:{v["border"]};background:{v["surface"]};
}}
{root} .trip-overview-day:nth-child(even) {{background:{v["alt"]};}}
{root} .trip-overview-day::after {{
 content:"";background:url("./assets/{id}/marker.svg") center/contain no-repeat;
 border-radius:{v["radius"]};animation:none;pointer-events:none;
}}
{root} .trip-overview-day-meta span {{
 background:{v["accent"]};border:1px solid {v["ink"]};
 color:{v["ink"]};border-radius:{v["radius"]};
}}
{root} .trip-overview-day-meta time {{color:{v["muted"]};}}
{root} .trip-overview-day h3 {{
 font:700 1.18rem/1.2 var(--font-display);
 color:{v["ink"]};max-width:100%;overflow-wrap:anywhere;
}}
{root} .trip-overview-day p {{color:{v["muted"]};}}
{root} .trip-highlight-card {{
 background:{v["alt"]};border:{v["border"]};
 border-radius:{v["radius"]};
}}
{root} .trip-open-decision {{background:{v["surface"]};}}
{root} :is(.trip-highlight-card,.trip-open-decision)::after {{
 background:url("./assets/{id}/marker.svg") center/contain no-repeat;
 animation:none;
}}
{root} .trip-day-view > .day-summary {{
 background:{v["alt"]};min-height:144px;
 padding:19px 116px 20px 19px;
}}
{root} .trip-day-view > .day-summary h2 {{
 font:700 clamp(1.55rem,4vw,2.6rem)/1.14 var(--font-display);
}}
{root} .trip-day-view > .day-summary::after {{
 background:url("./assets/{id}/marker.svg") center/contain no-repeat;
 animation:none;width:93px;height:93px;right:12px;
}}
{root} .trip-route-summary {{
 background:{v["surface"]};border:{v["border"]};
}}
{root} .trip-route-heading h3 {{
 font:700 1.16rem/1.25 var(--font-display);
}}
{root} .trip-route-endpoints {{
 border:1px solid {v["muted"]};border-radius:{v["radius"]};
 background:{v["alt"]};
}}
{root} .trip-route-steps span {{
 color:{v["ink"]};background:{v["surface"]};
 border:1px solid {v["muted"]};border-radius:{v["radius"]};
}}
{root} .trip-v2-timeline::before {{
 background:{v["ink"]};width:3px;left:13px;
}}
{root} .trip-v2-timeline > .trip-stop-wrap::before {{
 background:{v["accent"]};border:2px solid {v["ink"]};
 border-radius:{v["radius"]};
}}
{root} .trip-v2-timeline .trip-v2-item {{
 border:{v["border"]};border-radius:{v["radius"]};
 background:{v["surface"]};
}}
{root} .trip-v2-timeline .trip-stop-wrap:nth-child(even) .trip-v2-item {{
 background:{v["alt"]};
}}
{root} .trip-v2-timeline .timeline-content h3 {{
 color:{v["ink"]};font:700 1.12rem/1.3 var(--font-display);
}}
{root} .trip-v2-timeline .timeline-time {{
 color:{v["ink"]};background:{v["accent"]};
 border:1px solid {v["muted"]};border-radius:{v["radius"]};
 padding:5px 8px;font-weight:740;
}}
{root} .trip-v2-timeline .timeline-time--floating {{
 color:{v["ink"]};background:{v["surface"]};
}}
{root} .trip-v2-timeline .timeline-note {{color:{v["muted"]};}}
{root} .trip-v2-timeline .trip-transfer {{
 color:{v["ink"]};background:transparent;
 border-left:2px dashed {v["muted"]};border-radius:0;
}}
{root} :is(.type-pill,.must-go-tag,.transport-tag,.time-pill,
 .summary-count,.trip-open-count) {{
 background:{v["accent"]};color:{v["ink"]};
 border:1px solid {v["muted"]};border-radius:{v["radius"]};
 font-size:.75rem;
}}
{root} .must-go-tag {{background:{v["detail"]};color:{v["ink"]};}}
{root} :is(.day-chip,.place-chip,.long-trip-step,
 .button-link,.trip-icon-action,.trip-action-menu > summary,
 .theme-button,.motion-choice) {{
 background:{v["surface"]};border:1px solid {v["muted"]};
 color:{v["ink"]};border-radius:{v["radius"]};
}}
{root} :is(.day-chip,.place-chip).active,
{root} .motion-choice[aria-pressed="true"] {{
 background:{v["accent"]};color:{v["ink"]};
}}
{root} .day-chip.active small {{color:{v["ink"]};}}
{root} .bottom-nav {{
 background:{v["bg"]};border:{v["border"]};
 border-radius:{v["radius"]};
}}
{root} .nav-item {{
 color:{v["ink"]};border-radius:{v["radius"]};background:transparent;
}}
{root} .nav-item.active {{
 background:{v["accent"]};color:{v["ink"]};
 border:1px solid {v["ink"]};
}}
{root} .check-item {{
 background:{v["surface"]};border:{v["border"]};
 border-radius:{v["radius"]};
}}
{root} .more-section > summary,
{root} .cost-total {{
 background:{v["alt"]};border:1px solid {v["muted"]};
 border-radius:{v["radius"]};
}}
{root} .style-option {{
 background:{v["surface"]};color:{v["ink"]};
 border:{v["border"]};border-radius:{v["radius"]};
}}
{root} .style-option[aria-pressed="true"] {{
 background:{v["accent"]};outline:2px solid {v["ink"]};
}}
{root} .map-stage {{
 border:1px solid {v["muted"]};border-radius:{v["radius"]};
}}
{root} .shell-day.active {{
 background:{v["accent"]};color:{v["ink"]};
}}
'''
    # Identifiable MATERIAL + COMPOSITION differences in each pack.
    section=v['section']
    if section=='quiet':
        out+=f'''
{root} .trip-overview-hero {{
 border:0;border-bottom:2px dashed {v["ink"]};background:transparent;
 padding:14px 8px;
}}
{root} .trip-overview-hero::after {{
 background-position:right bottom;margin-top:0;
}}
{root} .trip-overview-day {{
 display:grid;grid-template-columns:86px minmax(0,1fr);
 grid-template-areas:"meta title" "meta route" "meta foot";
 gap:5px 12px;align-items:start;border:0;
 border-top:1px dashed {v["ink"]};border-radius:0;min-height:130px;
}}
{root} .trip-overview-day-meta {{
 grid-area:meta;flex-direction:column;align-items:flex-start;
}}
{root} .trip-overview-day h3 {{grid-area:title;max-width:calc(100% - 31px);}}
{root} .trip-overview-day p {{grid-area:route;}}
{root} .trip-overview-day-foot {{grid-area:foot;width:100%;}}
{root} .trip-overview-day::after {{
 width:43px;height:43px;top:10px;right:10px;
}}
{root} .trip-day-view > .day-summary {{border-style:dashed;}}
'''
    if section=='grid':
        out+=f'''
{root} .trip-overview-hero {{
 border:2px dashed {v["ink"]};padding:17px 19px;
}}
{root} .trip-overview-hero::after {{background-size:contain;}}
{root} .trip-overview-day:nth-child(3n+1) {{
 background:{v["surface"]};transform:rotate(-.1deg);
}}
{root} .trip-overview-day:nth-child(3n+2) {{background:{v["alt"]};}}
{root} .trip-overview-day:nth-child(3n+3) {{
 background:#E5EDEA;transform:rotate(.25deg);
}}
{root} .trip-overview-day::after {{transform:rotate(-6deg);}}
{root} .trip-v2-timeline .trip-v2-item {{border-style:dashed;}}
{root} .trip-overview-stats span {{border-style:dashed;}}
'''
    if section=='horizontal':
        out+=f'''
{root} .trip-overview-hero {{
 border:2px solid {v["ink"]};padding:15px 19px;
}}
{root} .trip-overview-hero::after {{
 background-size:contain;transform:rotate(-.4deg);
 animation:crayon-drift 9s ease-in-out infinite;
}}
{root} .trip-overview-day:nth-child(even) {{background:#E8F0E9;}}
{root} .trip-overview-day::after {{transform:rotate(4deg);}}
{root} .trip-v2-timeline .trip-v2-item {{border-style:dashed;}}
@keyframes crayon-drift {{
 0%,100%{{translate:0 0}}50%{{translate:0 -2px}}
}}
'''
    if section=='brush':
        out+=f'''
{root} .trip-header {{border:0;border-bottom:1px solid {v["muted"]};}}
{root} .trip-overview-hero {{
 border:0;padding:20px;
 background:{v["alt"]};border-radius:27px;
}}
{root} .trip-overview-hero::after {{margin-top:0;}}
{root} .trip-overview-day {{
 border:1px solid #B9CDD0;border-radius:19px;
 background:{v["surface"]};
}}
{root} .trip-overview-day:nth-child(even) {{background:#E9F0ED;}}
{root} .trip-day-view > .day-summary {{
 border:0;border-radius:22px;
 background:{v["alt"]};
}}
{root} .trip-v2-timeline .trip-v2-item {{
 border:1px solid #B9CDD0;border-radius:16px;
}}
'''
    if section=='geo':
        out+=f'''
{root} :is(.trip-header,.trip-overview-hero,
 .trip-overview-day,.trip-v2-timeline .trip-v2-item) {{
 border-radius:0;box-shadow:none!important;
}}
{root} .trip-header {{
 background:transparent;border:0;border-bottom:3px solid {v["ink"]};
}}
{root} .trip-overview-hero {{
 border:3px solid {v["ink"]};background:{v["bg"]};
}}
{root} .trip-overview-hero > h2 {{
 font-weight:900;letter-spacing:-.025em;
}}
{root} .trip-overview-day:nth-child(even) {{background:#E5E6D9;}}
{root} .trip-overview-day::after {{border-radius:0;}}
{root} .trip-day-view > .day-summary {{border:2px solid {v["ink"]};border-radius:0;}}
{root} .trip-v2-timeline .trip-v2-item {{border:1px solid {v["ink"]};border-radius:0;}}
'''
    if section=='space':
        out+=f'''
{root} .trip-header {{
 background:transparent;border:0;border-bottom:1px solid #D4D9D3;
}}
{root} .trip-overview-hero {{
 background:transparent;border:0;
 border-bottom:1px solid #C8D1C9;padding:21px 12px;
}}
{root} .trip-overview-hero::after {{
 width:100%;aspect-ratio:760/430;
 margin:4px 0 0;
}}
{root} .trip-overview-stats {{
 margin-top:1px;border-color:#C8D1C9;
}}
{root} .trip-overview-day {{
 border:0;border-bottom:1px solid #C8D1C9;border-radius:0;
 min-height:136px;background:transparent;
}}
{root} .trip-overview-day:nth-child(even) {{background:transparent;}}
{root} .trip-overview-day::after {{
 width:39px;height:39px;opacity:.78;
}}
{root} .trip-highlight-card {{
 background:transparent;border:0;border-left:2px solid #C8D1C9;
}}
{root} .trip-day-view > .day-summary {{
 background:transparent;border:0;border-bottom:1px solid #C8D1C9;
}}
{root} .trip-v2-timeline .trip-v2-item {{
 background:transparent;border:0;border-bottom:1px solid #C8D1C9;
}}
{root} .trip-v2-timeline .trip-stop-wrap:nth-child(even) .trip-v2-item {{
 background:transparent;
}}
'''
    out+=f'''
@media(max-width:520px){{
 {root} .trip-header {{padding:13px;}}
 {root} .trip-overview-hero {{
  grid-template-columns:minmax(0,1fr);padding:13px;
  gap:6px;
 }}
 {root} .trip-overview-hero > h2 {{
  font-size:clamp(1.7rem,6vw,2.15rem);
 }}
 {root} .trip-overview-hero::after {{
  width:100%;aspect-ratio:760/430;max-width:100%;margin:8px 0 0;
 }}
 {root} .trip-overview-day {{min-height:118px;padding:14px;}}
 {root} .trip-day-view > .day-summary {{
  padding:14px 80px 15px 13px;min-height:124px;
 }}
 {root} .trip-day-view > .day-summary::after {{
  width:65px;height:65px;right:8px;
 }}
 {root} .trip-v2-timeline .trip-v2-item {{padding:12px;}}
}}
@media(prefers-reduced-motion:reduce){{
 {root} *,{root} *::before,{root} *::after {{
  animation:none!important;transition:none!important;
 }}
}}
{root}[data-motion="reduce"] *,
{root}[data-motion="reduce"] *::before,
{root}[data-motion="reduce"] *::after {{
 animation:none!important;transition:none!important;
}}
'''
    file=R/(id+'-theme.css')
    file.write_text(out)
    print('CSS_PACK',file.name,len(out))
