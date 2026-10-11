"""Second, unfamiliar prompt batch: six deliberately distinct original SVG art packs.
These SVGs describe generic travel grammar only; no user destination photo was
provided. Do not infer monuments, persons, scenery, coordinates or signage.
Re-run with: python3 style-build/second-batch-art.py
"""
from pathlib import Path
from xml.etree import ElementTree as ET
from random import Random

R=Path(__file__).resolve().parents[1]
OUT=R/'assets'
def save(pack,name,body,width=760,height=430):
    d=OUT/pack;d.mkdir(parents=True,exist_ok=True)
    xml=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}"'
      f' role="img" aria-label="Generic {pack} travel illustration, not a real location">'
      +body+'</svg>\n')
    p=d/(name+'.svg');p.write_text(xml)
    ET.parse(p)
    print(pack,name,len(xml))

# 1: Quiet Linocut: three spot inks on warm fiber paper. The torn edge is
# confined to the art: no real website buttons/click targets are cut off.
linopaper='#F4EDDD';linonav='#253C51';linofade='#A0B4AE';linowarm='#B87862'
fuzz=''.join(f'<path d="M{x} {y}l{length} {dy}" stroke="{linonav}" stroke-width=".6" opacity=".10"/>'
   for x,y,length,dy in [(Random(i*11).randrange(12,748),Random(i*29).randrange(12,420),1+i%4,(-1)**i) for i in range(160)])
linocut=f'''<defs>
<clipPath id="tear"><path d="M9 12H717L729 28L718 52L731 80L721 99L735 125L719 154L735 182L721 206L734 236L719 267L735 294L720 320L734 346L719 370L733 391L719 414L9 414Z"/></clipPath>
<pattern id="cut" width="15" height="11" patternUnits="userSpaceOnUse"><path d="M2 7l4-2m4-1h2" stroke="{linopaper}" stroke-width="1.25"/></pattern>
</defs>
<g clip-path="url(#tear)"><rect width="750" height="430" fill="{linopaper}"/>
{fuzz}
<path d="M25 369Q220 361 380 370Q574 363 732 365" fill="none" stroke="{linonav}" stroke-width="2" stroke-dasharray="72 4 44 6"/>
<path d="M24 377Q182 377 367 380Q522 380 729 375" fill="none" stroke="{linofade}" stroke-width="6" opacity=".66"/>
<g transform="translate(565 228)">
<path d="M-19 120Q-19 79 10 57L55 39L95 59L117 125" fill="{linofade}"/>
<path d="M-13 116L10 59L54 41L94 60L111 119" fill="none" stroke="{linonav}" stroke-width="10" stroke-linecap="square" stroke-dasharray="49 2 30 4"/>
<path d="M54 44V127" fill="none" stroke="{linonav}" stroke-width="8" stroke-dasharray="22 2"/>
<path d="M17 126H98" stroke="{linonav}" stroke-width="8" stroke-dasharray="15 3 34 2"/>
<rect x="38" y="74" width="32" height="29" fill="{linopaper}"/>
<path d="M53 75v28m-15-14h32" stroke="{linofade}" stroke-width="3"/>
<path d="M0 138h130" stroke="{linonav}" stroke-width="2" stroke-dasharray="19 6 26 3"/>
<path d="M4 52Q-9 30-25 39" fill="none" stroke="{linonav}" stroke-width="3" stroke-linecap="square"/>
<circle cx="-27" cy="38" r="11" fill="{linowarm}" stroke="{linonav}" stroke-width="3"/>
</g>
<path d="M490 386h205" stroke="{linonav}" stroke-width="3" stroke-dasharray="14 7 31 4" opacity=".6"/>
</g>'''
save('quiet-linocut','hero',linocut)
linomark=f'''<rect width="160" height="160" fill="{linopaper}"/>
<path d="M9 10H142L151 36L140 62L151 91L138 121L150 148H8Z" fill="none" stroke="{linonav}" stroke-width="5"/>
<path d="M31 123L70 69L112 121" fill="none" stroke="{linonav}" stroke-width="9" stroke-dasharray="19 3 29 4"/>
<path d="M79 70v55M28 136h102" stroke="{linofade}" stroke-width="5"/>
<circle cx="113" cy="43" r="14" fill="{linowarm}"/>'''
save('quiet-linocut','marker',linomark,160,160)

# 2: Doodle Memory Grid: nine decorative visual ideas in a loose organic 3x3.
# Do NOT falsely infer the real trip contains nine stops, nine photos or labels.
paper='#FBF6EA';dark='#514D51';peach='#E7ABA2';blue='#A3C5D5';green='#A8C1A8';yellow='#E7C986'
riso_dots=''.join(f'<circle cx="{Random(j*37).randrange(23,729)}" cy="{Random(j*7).randrange(23,411)}" r=".85" fill="{dark}" opacity=".1"/>'
 for j in range(170))
doodle=f'''<rect width="760" height="430" fill="{paper}"/>
{riso_dots}
<path d="M212 111Q377 103 617 111M221 223Q410 232 631 213M224 337Q450 333 634 340M222 76v302M358 81v295M498 81v292M639 78v296"
 fill="none" stroke="{dark}" stroke-width=".8" opacity=".12" stroke-dasharray="6 14"/>
<g transform="translate(226 56)" stroke="{dark}" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2">
<!-- 1 sun -->
<g transform="rotate(-6 48 45)"><circle cx="48" cy="43" r="21" fill="{yellow}"/><path d="M47 11v-9m0 81v7M14 44H5m79 0h9M24 20l-7-7m61 60 6 7m-60-7-7 7m61-60 7-7" fill="none"/></g>
<!-- 2 stylized book -->
<g transform="translate(135 0) rotate(5 53 52)"><path d="M16 25Q38 19 51 36Q68 23 86 26V81Q64 70 51 83Q37 70 16 78Z" fill="{blue}"/><path d="M51 36v47M28 44l16 2M63 44l14-3" fill="none"/></g>
<!-- 3 small hat -->
<g transform="translate(267 8) rotate(-8 52 47)"><path d="M22 60Q33 27 57 27Q78 28 85 60Z" fill="{peach}"/><path d="M11 66Q48 52 98 66Q77 85 22 70Z" fill="{yellow}"/></g>
<!-- 4 cup -->
<g transform="translate(0 117) rotate(5 46 44)"><path d="M19 20L29 72Q49 89 71 72L77 20Z" fill="{peach}"/><path d="M77 29Q112 19 103 46Q100 59 81 55M27 22q22 9 46 0" fill="none"/><path d="M41 6q-6-8 1-14" fill="none" opacity=".65"/></g>
<!-- 5 cloud and rain -->
<g transform="translate(137 116) rotate(-7 50 44)"><path d="M14 58Q-2 38 20 28Q31 7 54 25Q73 8 87 31Q105 35 91 59Z" fill="{blue}"/><path d="M36 70l-4 14m27-14-3 14m27-14-3 14" fill="none"/></g>
<!-- 6 tiny train -->
<g transform="translate(275 120) rotate(4 48 43)"><rect x="18" y="18" width="78" height="59" rx="12" fill="{green}"/><rect x="29" y="29" width="25" height="25" rx="4" fill="{paper}"/><rect x="61" y="29" width="25" height="25" rx="4" fill="{paper}"/><circle cx="38" cy="81" r="7" fill="{peach}"/><circle cx="77" cy="81" r="7" fill="{peach}"/></g>
<!-- 7 plant -->
<g transform="translate(8 232) rotate(-4 45 36)"><path d="M22 58h66l-12 29H34Z" fill="{peach}"/><path d="M55 59V1Q27 6 30 35Q48 41 55 16Q58-9 78 14Q81 35 58 39" fill="{green}"/></g>
<!-- 8 winding path -->
<g transform="translate(133 231) rotate(10 52 44)"><path d="M15 78Q67 63 42 39Q21 16 83 6" fill="none" stroke="{blue}" stroke-width="12"/><circle cx="82" cy="8" r="9" fill="{yellow}"/><path d="M10 78l9 7" fill="none"/></g>
<!-- 9 small star -->
<g transform="translate(275 225) rotate(-11 55 49)"><path d="M53 9L65 43L102 44L74 63L85 93L54 77L25 95L33 62L6 44L44 44Z" fill="{yellow}" stroke-linejoin="round"/></g>
</g>'''
save('doodle-memory-grid','hero',doodle)
save('doodle-memory-grid','marker',f'<rect width="160" height="160" fill="{paper}"/><g stroke="{dark}" stroke-width="3" fill="none"><path d="M16 54h128M16 105h128M54 16v128M106 16v128" opacity=".2"/></g><g fill="{peach}" stroke="{dark}" stroke-width="2"><circle cx="36" cy="34" r="13"/><rect x="63" y="19" width="28" height="28" rx="6" fill="{blue}"/><circle cx="127" cy="35" r="11" fill="{yellow}"/><path d="M21 82l15-20 14 22Z" fill="{green}"/><rect x="66" y="68" width="24" height="24" rx="4"/><path d="M111 75l15-9 16 12-14 13Z" fill="{blue}"/><circle cx="35" cy="127" r="11" fill="{yellow}"/><path d="M79 112l14 14-13 15-15-15Z" fill="{green}"/><circle cx="127" cy="126" r="13"/></g>',160,160)

# 3: Crayon Journal: horizontal 2-5 objects, heavy local crayon hatch strokes
# and no rigid modules (a deliberate contrast to Doodle Grid).
paper='#FAF2E6';char='#53565D';coral='#C98679';aqua='#76AEB5';ochre='#D7AD69';sage='#91AC91'
rng=Random(4393)
scratch=''.join(f'<path d="M{rng.randrange(135,695)} {rng.randrange(230,372)}l{rng.randrange(2,10)} {rng.randrange(-4,2)}" fill="none" stroke="{rng.choice([coral,aqua,ochre,sage,char])}" stroke-width="{rng.choice([1,2])}" opacity=".24"/>'
 for _ in range(220))
crayon=f'''<rect width="760" height="430" fill="{paper}"/>
<path d="M74 356Q220 336 396 348Q550 344 698 354" fill="none" stroke="{aqua}" stroke-width="14" stroke-linecap="round" opacity=".42"/>
{scratch}
<g stroke="{char}" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M185 343L177 251Q174 230 190 220L241 220Q258 230 258 252L251 343Z" fill="{coral}" stroke-width="4.8" stroke-dasharray="31 2 35 3"/>
<path d="M201 219v-10Q215 196 237 208v11" stroke-width="4"/>
<path d="M185 283h70m-33-32v68" stroke-width="3" opacity=".67"/>
<circle cx="196" cy="346" r="9" fill="{char}" stroke-width="1"/><circle cx="242" cy="346" r="9" fill="{char}" stroke-width="1"/>
<path d="M321 330Q307 300 340 297Q349 263 380 275Q410 250 438 285Q466 285 460 309Q451 333 413 328Z" fill="{aqua}" stroke-width="5"/>
<path d="M348 327l-5 17m69-17 7 16" stroke-width="3"/>
<path d="M484 351l1-97m0 27q-37-36-48-19m49-7q14-39 36-30" stroke="{char}" stroke-width="5"/>
<path d="M471 255Q437 227 425 254Q444 271 471 255Z" fill="{sage}" stroke-width="3"/>
<path d="M499 231Q511 201 536 210Q532 236 499 231Z" fill="{sage}" stroke-width="3"/>
<path d="M577 303Q574 267 612 267Q645 265 655 299L638 341H585Z" fill="{ochre}" stroke-width="5"/>
<path d="M583 306q40 8 66 0m-24 10q-8 12-19 2" stroke-width="3"/>
<path d="M161 354Q281 368 375 359Q533 368 673 351" stroke="{char}" stroke-width="2.3" opacity=".6"/>
</g>
<g stroke="{paper}" stroke-width="2.7" stroke-linecap="round" opacity=".55">
<path d="M192 243l49 4m-46 14 45 8m-48 10 48 9m-48 11 44 11m-41 8 44 9"/>
<path d="M329 305l98-7m-89 16 105-8m-91 20 85-13"/>
<path d="M592 296l42 7m-40 12 37 7"/>
</g>'''
save('crayon-journal','hero',crayon)
save('crayon-journal','marker',f'''<rect width="160" height="160" fill="{paper}"/><path d="M36 134l-4-81q1-13 12-13h59q12 0 12 13l4 81" fill="{coral}" stroke="{char}" stroke-width="5" stroke-linecap="round" stroke-dasharray="34 3 29 2"/><path d="M57 43V27Q78 13 93 28v15" fill="none" stroke="{char}" stroke-width="5"/><path d="M45 72l58 8M48 91l53 8M49 109l53 8" stroke="{paper}" stroke-width="5" opacity=".7"/><circle cx="55" cy="138" r="8" fill="{char}"/><circle cx="103" cy="138" r="8" fill="{char}"/>''',160,160)

# 4 Painterly Editorial — dry-brush irregular shapes on airy pastel blue paper.
background='#F4F7F1';blue1='#B5D2DE';blue2='#7EA9C2';blue3='#D8E7EA';peach='#DBA6A0';olive='#A3BBAD'
rng=Random(919)
brush=''.join(f'<path d="M{rng.randint(257,704)} {rng.randint(118,351)}q{rng.randint(9,25)} {rng.randint(-8,8)} {rng.randint(34,70)} {rng.randint(-4,12)}" stroke="{rng.choice([blue1,blue2,blue3,peach,olive])}" stroke-width="{rng.randint(2,8)}" opacity="{rng.uniform(.13,.34):.2f}" fill="none" stroke-linecap="round"/>'
 for _ in range(105))
painterly=f'''<defs><filter id="brush" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".017" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
<rect width="760" height="430" fill="{background}"/>
<g filter="url(#brush)">
<path d="M283 352Q229 288 333 229Q383 112 504 154Q579 109 676 197Q719 271 664 349Z" fill="{blue3}"/>
<path d="M347 353Q292 305 358 231Q439 147 522 224Q563 187 612 231Q671 307 612 354Z" fill="{blue1}" opacity=".85"/>
<path d="M388 351Q404 243 481 222Q555 209 595 290Q569 331 607 352" fill="{blue2}" opacity=".78"/>
<path d="M542 239Q577 196 619 227Q649 260 618 301Q579 315 547 287Z" fill="{peach}" opacity=".72"/>
<path d="M300 365Q467 344 683 360" fill="none" stroke="{olive}" stroke-width="16" stroke-linecap="round" opacity=".62"/>
</g>
{brush}
<g fill="none" stroke="{background}" stroke-width="3.5" opacity=".6">
<path d="M395 311Q431 271 490 280M418 335q88-52 153-25M466 217q59-18 93 12"/>
</g>
'''
save('painterly-editorial','hero',painterly)
save('painterly-editorial','marker',f'''<defs><filter id="brush"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter></defs>
<rect width="160" height="160" fill="{background}"/><g filter="url(#brush)"><path d="M24 122Q18 74 57 51Q96 25 132 74Q158 111 113 139Z" fill="{blue1}"/><path d="M65 134Q65 66 115 78Q134 91 133 124Z" fill="{blue2}"/><circle cx="103" cy="60" r="19" fill="{peach}"/></g>''',160,160)

# 5 Hard-edge polygon art: NO stroke, shadow or gradient in the illustration.
cream='#F5F0E5';indigo='#334A62';slate='#718DA0';mint='#95A99B';coral='#C78B77';yellow='#E0BD79'
geo=f'''<rect width="760" height="430" fill="{cream}"/>
<polygon points="236,352 340,195 493,352" fill="{mint}"/>
<polygon points="306,353 408,113 495,353" fill="{slate}"/>
<polygon points="384,348 440,198 494,348" fill="{indigo}"/>
<polygon points="312,351 371,287 412,351" fill="{coral}"/>
<polygon points="421,353 498,246 615,355" fill="{yellow}"/>
<polygon points="497,355 545,192 608,352" fill="{slate}"/>
<polygon points="542,259 545,192 582,300" fill="{mint}"/>
<polygon points="589,340 638,261 698,352" fill="{indigo}"/>
<polygon points="584,340 621,295 651,340" fill="{coral}"/>
<polygon points="280,359 318,359 329,385 284,385" fill="{indigo}"/>
<polygon points="325,359 387,358 386,376 336,376" fill="{slate}"/>
<polygon points="378,359 694,358 672,368 380,367" fill="{mint}"/>
<polygon points="404,181 438,116 471,183" fill="{coral}"/>
<polygon points="424,183 438,116 455,183" fill="{yellow}"/>
<circle cx="603" cy="122" r="26" fill="{yellow}"/>
<polygon points="609,97 627,118 607,146 583,124" fill="{coral}"/>
<rect x="238" y="390" width="463" height="3" fill="{indigo}" opacity=".4"/>'''
save('geometric-print','hero',geo)
save('geometric-print','marker',f'''<rect width="160" height="160" fill="{cream}"/><polygon points="24,135 71,29 123,135" fill="{slate}"/><polygon points="66,135 100,64 147,135" fill="{indigo}"/><polygon points="68,135 88,105 100,135" fill="{coral}"/><circle cx="113" cy="36" r="14" fill="{yellow}"/>''',160,160)

# 6 Quiet Acrylic: a genuinely tiny thin-line composition, not crayon or
# large brush painting. 85% of SVG area is untouched paper.
paper='#FCFAF3';line='#6A7171';teal='#93B7AF';pale='#D9A99C'
specks=''.join(f'<path d="M{Random(i*31).randint(6,754)} {Random(i*43).randint(9,421)}h{1+i%3}" stroke="{line}" stroke-width=".45" opacity=".07"/>'
 for i in range(95))
acrylic=f'''<rect width="760" height="430" fill="{paper}"/>
{specks}
<g transform="translate(474 242)">
<path d="M-28 56q-27-34-7-71q20-21 49-8q24 9 15 41l-9 38" fill="{teal}" opacity=".86"/>
<path d="M-28 55Q-50 14-32-15Q-8-39 12-22Q41-11 27 20l-9 34" fill="none" stroke="{line}" stroke-width="1.9" stroke-dasharray="24 2 16 4"/>
<path d="M-53 54q30 8 73-1" fill="none" stroke="{line}" stroke-width="1.5"/>
<path d="M-34-1q14-11 24-1M-9-19l7-30M-2-33q-26-11-32-29M2-35q8-21 27-18" fill="none" stroke="{line}" stroke-width="1.4" stroke-linecap="round"/>
<path d="M-6-42Q-25-70-38-53Q-26-40-6-42Z" fill="{pale}" opacity=".74"/>
<path d="M14-41q9-21 24-15q-7 18-24 15" fill="{teal}"/>
<path d="M-20 51l3 6m15-6 2 4" fill="none" stroke="{paper}" stroke-width="2" opacity=".5"/>
</g>
<path d="M428 322q41-5 84 1" fill="none" stroke="{line}" stroke-width="1" opacity=".24"/>'''
save('quiet-acrylic','hero',acrylic)
save('quiet-acrylic','marker',f'''<rect width="160" height="160" fill="{paper}"/><g transform="translate(81 85)">
<path d="M-12 25Q-35-4-14-28Q14-37 24-9Q30 12 14 27" fill="{teal}" opacity=".8"/><path d="M-12 25Q-29 2-14-28Q14-37 24-9Q30 12 14 27" fill="none" stroke="{line}" stroke-width="1.7"/><path d="M-5-30v-18m0 15q-20-14-28-6m32 5q19-16 25-11" fill="none" stroke="{line}" stroke-width="1.4"/><path d="M-5-39q-12-14-27-8Q-27-29-5-39Z" fill="{pale}"/></g>''',160,160)

print('Six distinctive SVG hero/marker pairs created and XML-validated')
