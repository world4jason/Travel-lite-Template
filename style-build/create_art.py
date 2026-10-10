"""Source-controlled deterministic generic SVG artwork for four visual languages.
No input photograph was provided: these are conceptual travel motifs, not
asserted landmarks, camera views, transit lines or geographical descriptions.
"""
from pathlib import Path
from xml.etree import ElementTree as ET
from random import Random
from html import escape

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets'
INK='#253F56'; IVORY='#FAF3E4'; VERMILION='#BE5F3E'

def save(pack,name,body,size='640 380'):
    dir=OUT/pack;dir.mkdir(exist_ok=True,parents=True)
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size}" role="img" aria-label="{escape(pack + " illustrative travel art")}">{body}</svg>\n'
    target=dir/(name+'.svg')
    target.write_text(svg)
    ET.parse(target)
    print(target.relative_to(ROOT),len(svg))

# 1. Paper Collage — visibly independent cardstock layers, cut edge,
# natural paper fibers and soft contact shadows.
cut='#F2DCC8';pine='#467C78';ochre='#F0B87B';sand='#E9C69E';sea='#9FCCD0';rose='#D98D87'
def paper_layer(shape):
    return f'<g filter="url(#contact)">{shape}</g>'
paper_defs='''<defs><filter id="contact" x="-8%" y="-8%" width="125%" height="128%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="soft"/><feOffset in="soft" dx="0" dy="3" result="lower"/><feComponentTransfer in="lower" result="shadow"><feFuncA type="linear" slope=".23"/></feComponentTransfer><feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="fiber" width="21" height="24" patternUnits="userSpaceOnUse"><path d="M3 5l2 1m8 8l2-1m4 6h1" stroke="#856D5A" opacity=".18" stroke-width=".6"/></pattern></defs>'''
paper_hero=paper_defs+f'''
<rect width="640" height="380" rx="32" fill="{IVORY}"/>
{paper_layer(f'<path d="M26 260Q105 181 192 237Q285 126 370 199Q462 151 614 236V342H26Z" fill="{sand}"/>')}
{paper_layer(f'<path d="M26 275Q153 197 255 257Q341 168 454 243Q545 212 614 263V341H26Z" fill="{pine}"/>')}
{paper_layer(f'<circle cx="486" cy="91" r="49" fill="{ochre}"/>')}
{paper_layer(f'<path d="M29 306Q103 275 169 303Q252 260 331 307Q431 272 512 299Q583 267 611 290V347H29Z" fill="{sea}"/>')}
{paper_layer(f'<path d="M58 314Q179 292 271 316Q420 288 588 315" fill="none" stroke="{IVORY}" stroke-width="15" stroke-linecap="round"/>')}
{paper_layer(f'<rect x="116" y="184" width="129" height="131" rx="6" fill="{cut}"/>')}
{paper_layer(f'<path d="M108 189L179 137L257 187Z" fill="{rose}"/>')}
{paper_layer(f'<rect x="146" y="222" width="33" height="44" rx="3" fill="{sea}"/><rect x="196" y="222" width="30" height="44" rx="3" fill="{sea}"/>')}
{paper_layer(f'<rect x="175" y="273" width="34" height="42" rx="4" fill="{ochre}"/>')}
{paper_layer(f'<path d="M378 318l-1-113" fill="none" stroke="{sand}" stroke-width="19" stroke-linecap="round"/>')}
{paper_layer(f'<circle cx="373" cy="184" r="44" fill="{pine}"/><circle cx="342" cy="209" r="29" fill="{pine}"/><circle cx="406" cy="209" r="31" fill="{pine}"/>')}
<rect width="640" height="380" rx="32" fill="url(#fiber)" opacity=".65"/>'''
save('paper-collage','hero',paper_hero)
paper_mark=paper_defs+f'<rect x="9" y="9" width="142" height="142" rx="22" fill="{IVORY}"/>'+paper_layer(f'<path d="M24 106Q56 53 88 99Q118 57 135 104V136H24Z" fill="{pine}"/>')+paper_layer(f'<circle cx="112" cy="43" r="21" fill="{ochre}"/>')+paper_layer(f'<path d="M36 119Q69 97 105 122" fill="none" stroke="{sea}" stroke-width="15" stroke-linecap="round"/>')
save('paper-collage','marker',paper_mark,'160 160')
paper_small=paper_defs+f'<rect width="180" height="140" rx="12" fill="{IVORY}"/>'+paper_layer(f'<rect x="26" y="42" width="127" height="74" rx="6" fill="{cut}"/>')+paper_layer(f'<path d="M24 45l66-31 68 31Z" fill="{rose}"/>')+paper_layer(f'<rect x="52" y="64" width="25" height="35" rx="5" fill="{sea}"/><rect x="104" y="63" width="28" height="36" rx="5" fill="{sea}"/>')
save('paper-collage','street',paper_small,'180 140')

# 2. Naive City Sketch — hand-drawn wobbly indigo strokes, deliberately
# crooked houses, lopsided ordinary figures, flat gouache, imperfect overprint.
navy='#233C65';cream='#FAF5E9';salmon='#D88F87';mustard='#E3B15A';blue='#8DAEBB';green='#8CA78C'
rnd=Random(12)
spatter=''.join(f'<path d="M{rnd.randint(8,615)} {rnd.randint(14,375)}l{rnd.randint(1,3)} 1" stroke="{navy}" stroke-width=".75" opacity=".16"/>' for _ in range(170))
naive_hero=f'''<rect width="640" height="380" fill="{cream}"/>
<path d="M22 279Q114 254 214 281Q311 264 421 281Q530 273 616 294V378H20Z" fill="{blue}" opacity=".4"/>
<path d="M29 309l-9-173 90-18 5 198Z" fill="{salmon}" stroke="{navy}" stroke-width="5" stroke-linejoin="round"/>
<path d="M18 137l47-46 51 31-88 26" fill="{mustard}" stroke="{navy}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M144 320l11-211 110-6-3 219" fill="{blue}" stroke="{navy}" stroke-width="5" stroke-linejoin="round"/>
<path d="M148 110l56-45 63 33-119 13Z" fill="{green}" stroke="{navy}" stroke-width="5" stroke-linejoin="round"/>
<path d="M303 323l-13-155 100-6 8 157" fill="{mustard}" stroke="{navy}" stroke-width="5" stroke-linejoin="round"/>
<path d="M288 169l49-55 56 46" fill="{salmon}" stroke="{navy}" stroke-width="5" stroke-linecap="round"/>
<path d="M428 318l8-177 139 10-6 170Z" fill="{salmon}" stroke="{navy}" stroke-width="5" stroke-linejoin="round"/>
<path d="M432 145l71-53 77 62" fill="none" stroke="{navy}" stroke-width="5" stroke-linecap="round"/>
<g fill="{cream}" stroke="{navy}" stroke-width="4"><path d="M48 176l23-3 1 31-27 1Z"/><path d="M165 154l32 2-2 43-32-4Z"/><path d="M220 161l28-4 2 37-27 2Z"/><path d="M325 200l25-4 3 35-28 2Z"/><path d="M468 192l33 5-2 36-33-4Z"/><path d="M519 200l28 3-1 30-26 3Z"/></g>
<path d="M44 314l565-1M45 320q115 4 226 0q124 8 239 0" fill="none" stroke="{navy}" stroke-width="3" stroke-linecap="round"/>
<path d="M125 309q5-83 8-92" stroke="{navy}" stroke-width="5" fill="none"/>
<path d="M108 230q-24-25-9-42q8-6 21 2q8-24 23-20q18 14 7 39q22-4 29 10q6 18-15 27q-13 4-29-7q-12 18-27-9" fill="{green}" stroke="{navy}" stroke-width="4" stroke-linejoin="round"/>
<g stroke="{navy}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M207 328l-3-47m8 45l9-41m-19-42l-9 25m19-24l26 13"/><path d="M525 325l-9-45m9 45l15-43m-16-38l-20 27m22-28l24 30"/></g>
<g fill="{navy}"><ellipse cx="202" cy="236" rx="15" ry="19"/><ellipse cx="524" cy="235" rx="16" ry="18"/></g>
<g fill="{mustard}" stroke="{navy}" stroke-width="3"><path d="M190 261q10-10 26 0l5 28-30 4Z"/><path d="M511 263q13-11 27-1l9 29-40 1Z"/></g>
<path d="M284 80q11-9 23 0m31-31q12-9 24 0" fill="none" stroke="{navy}" stroke-width="3" stroke-linecap="round"/>
{spatter}'''
save('naive-city','hero',naive_hero)
naive_icon=f'''<rect x="4" y="4" width="152" height="152" rx="15" fill="{cream}" stroke="{navy}" stroke-width="3"/>
<path d="M22 129l8-88 93-8 7 96Z" fill="{salmon}" stroke="{navy}" stroke-width="4" stroke-linejoin="round"/><path d="M20 42l55-28 53 17" fill="none" stroke="{navy}" stroke-width="5"/>
<path d="M41 72l22-3v23H40Z" fill="{blue}" stroke="{navy}" stroke-width="4"/><path d="M89 70l19 2-2 24-20-2Z" fill="{cream}" stroke="{navy}" stroke-width="4"/>
<path d="M70 129l-4-20 24 2v18" fill="{mustard}" stroke="{navy}" stroke-width="3"/>'''
save('naive-city','marker',naive_icon,'160 160')

# 3. Mid-century Taiwan retro poster — graphic language informed by four
# user sample posters. NO fabricated Taipei/Tainan/Taichung landmarks/labels;
# generic urban silhouettes, canopy, streets and bus as a decorative motif.
paper='#F5E7C4';blue='#143C56';teal='#42717C';yellow='#E3AF50';red='#B64D33';olive='#778366'
ink_defs=f'''<defs><pattern id="dust" width="19" height="21" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".8" fill="{paper}" opacity=".29"/><circle cx="14" cy="15" r=".6" fill="{blue}" opacity=".32"/></pattern><pattern id="halftone" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r="1.2" fill="{blue}" opacity=".35"/></pattern></defs>'''
poster_hero=ink_defs+f'''<rect width="640" height="380" fill="{yellow}"/>
<path d="M0 160Q65 130 138 172Q199 141 250 180Q310 136 368 175Q440 140 490 177Q548 139 640 178V243H0Z" fill="{paper}" opacity=".95"/>
<path d="M0 242L54 211L88 230L118 201L158 241L224 213L270 241L328 220L387 245L469 212L514 240L579 221L640 246V380H0Z" fill="{teal}"/>
<path d="M3 273V174H80V269H99V145H163V276H193V187H244V276H270V121H342V273H378V158H437V274H454V211H515V272H539V167H602V283H639V380H0V280Z" fill="{paper}"/>
<path d="M85 181v80M113 170v83M139 174v79M276 153v93M301 148v91M330 162v88M382 186v70M411 184v71M543 195v63M568 195v62" stroke="{blue}" stroke-width="10" opacity=".78"/>
<path d="M0 0h90Q100 75 144 82L165 0H227L211 42L256 0H325L255 84L195 110L154 171L77 245L20 262L76 145L34 167Z" fill="{blue}"/>
<path d="M33 22Q107 1 146 29Q177 0 249 5M19 62Q106 42 155 60Q202 28 255 48M61 112Q99 92 144 111Q187 66 237 87" fill="none" stroke="{blue}" stroke-width="26" stroke-linecap="round"/>
<path d="M0 295Q180 276 640 302V380H0Z" fill="{blue}"/>
<path d="M22 349Q215 324 633 351" fill="none" stroke="{yellow}" stroke-width="7" stroke-dasharray="38 28" opacity=".8"/>
<path d="M449 266h112q15 1 19 23v39H437v-38q3-24 12-24Z" fill="{red}" stroke="{paper}" stroke-width="5"/>
<path d="M458 273h88l7 27h-103Z" fill="{paper}"/><path d="M472 273v29M514 273v29" stroke="{blue}" stroke-width="4"/>
<circle cx="470" cy="329" r="12" fill="{blue}" stroke="{paper}" stroke-width="3"/><circle cx="546" cy="329" r="12" fill="{blue}" stroke="{paper}" stroke-width="3"/>
<path d="M0 0h640v380H0Z" fill="url(#dust)" opacity=".55"/>
<rect x="4" y="4" width="632" height="372" fill="none" stroke="{paper}" stroke-width="8"/>'''
save('taiwan-poster','hero',poster_hero)
poster_mini=ink_defs+f'<rect width="160" height="160" fill="{paper}"/><path d="M7 152V51H43V125H55V32H107V125H130V70H153V154Z" fill="{blue}"/><path d="M13 82h20M64 64h35M64 89h35M134 90h17" stroke="{yellow}" stroke-width="7"/><path d="M2 133h155v19H2Z" fill="{red}"/><rect width="160" height="160" fill="url(#dust)" opacity=".6"/>'
save('taiwan-poster','marker',poster_mini,'160 160')

# 4. Field Stamp — quiet field record with rough hand-carved edges and
# 2-3 imperfect spot-inks. Separate from Riso's regular dot grid.
field_paper='#F7F0E3';field_ink='#293C31';field_red='#A76D52';field_blue='#617E81'
rng=Random(2917)
holes=''.join(f'<path d="M{rng.randint(42,600)} {rng.randint(74,328)}l{rng.randint(2,8)} {rng.choice([-1,0,1])}" stroke="{field_paper}" stroke-width="{rng.uniform(.6,2.5):.1f}" opacity=".87"/>' for _ in range(320))
field_hero=f'''<rect x="0" y="0" width="640" height="380" fill="{field_paper}"/>
<path d="M34 45L597 51L606 331L29 326Z" fill="none" stroke="{field_ink}" stroke-width="8" stroke-linejoin="miter" stroke-dasharray="106 5 37 4 134 8"/>
<path d="M48 259Q102 222 156 250Q239 135 316 209Q380 165 433 213Q528 172 589 230V320H48Z" fill="{field_ink}"/>
<path d="M46 285Q138 247 217 278Q309 252 390 284Q480 246 587 284" fill="none" stroke="{field_paper}" stroke-width="13" stroke-linecap="square"/>
<path d="M81 280V166L145 136L209 165V277" fill="none" stroke="{field_ink}" stroke-width="19" stroke-linecap="square"/>
<path d="M87 173L142 119L213 163" fill="none" stroke="{field_ink}" stroke-width="9" stroke-linecap="square"/>
<path d="M115 197h17v31h-17m34-31h19v31h-19m-16 52v-33h27v33" fill="none" stroke="{field_paper}" stroke-width="9"/>
<circle cx="477" cy="110" r="33" fill="{field_red}" transform="translate(4 0)"/>
<circle cx="475" cy="111" r="31" fill="none" stroke="{field_ink}" stroke-width="6" stroke-dasharray="17 3 23 4"/>
<path d="M319 271l-1-90m0 15q-36-43-53-21m53-17q29-39 49-21m-49 35q27-16 55-7" fill="none" stroke="{field_ink}" stroke-width="13" stroke-linecap="square"/>
<path d="M56 326Q178 300 298 324Q414 302 574 318" fill="none" stroke="{field_ink}" stroke-width="8" stroke-dasharray="14 7 63 12 40 6"/>
<path d="M41 44l559 3M38 335l570-6" fill="none" stroke="{field_red}" stroke-width="3" stroke-dasharray="55 3 29 8 60 6" opacity=".75"/>
{holes}
<path d="M0 0h640v380H0Z" fill="none" stroke="{field_paper}" stroke-width="14"/>'''
save('field-stamp','hero',field_hero)
stamp_mark=f'''<rect width="160" height="160" fill="{field_paper}"/>
<path d="M14 18l132 4-2 126-132-3Z" fill="none" stroke="{field_ink}" stroke-width="5" stroke-dasharray="31 4 58 3"/>
<path d="M22 120Q52 59 88 110Q113 58 139 116V132H22Z" fill="{field_ink}"/>
<path d="M39 124q27-18 43 1" fill="none" stroke="{field_paper}" stroke-width="8"/>
<circle cx="103" cy="60" r="19" fill="{field_red}" transform="translate(2 0)"/>
<path d="M23 136h112" stroke="{field_ink}" stroke-width="5" stroke-dasharray="12 4 20 5"/>'''
save('field-stamp','marker',stamp_mark,'160 160')

print('All generated source SVGs parse successfully.')
