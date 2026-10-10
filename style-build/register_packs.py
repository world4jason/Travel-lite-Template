from pathlib import Path
import json,re
r=Path(__file__).resolve().parent.parent

def change(name,old,new):
 p=r/name;s=p.read_text()
 if old not in s:raise RuntimeError(f'{name} needle missing: {old[:100]}')
 p.write_text(s.replace(old,new,1))
def append(name,text):
 p=r/name;p.write_text(p.read_text()+text)
change("app.js",
'''  risograph: { css: ["risograph-style"], lightOnly: true, timeline: true, motion: false },
});''',
'''  risograph: { css: ["risograph-style"], lightOnly: true, timeline: true, motion: false },
  "paper-collage": { css: ["storybook-style", "paper-collage-style"], lightOnly: true, timeline: true, motion: true },
  "naive-city": { css: ["storybook-style", "naive-city-style"], lightOnly: true, timeline: true, motion: true },
  "taiwan-poster": { css: ["storybook-style", "taiwan-poster-style"], lightOnly: true, timeline: true, motion: false },
  "field-stamp": { css: ["storybook-style", "field-stamp-style"], lightOnly: true, timeline: true, motion: false },
});''')
change("app.js",
'''  risograph: "#F7F1E4" })[state.visualStyle] || "#f5f6f2";''',
'''  risograph: "#F7F1E4", "paper-collage": "#FAF3E4", "naive-city": "#FAF5E9",
  "taiwan-poster": "#F5E7C4", "field-stamp": "#F7F0E3" })[state.visualStyle] || "#f5f6f2";''')
change("app.js",
'''  for (const id of ["storybook-style", "candy-style", "risograph-style"]) {''',
'''  for (const id of ["storybook-style", "candy-style", "risograph-style",
    "paper-collage-style", "naive-city-style", "taiwan-poster-style", "field-stamp-style"]) {''')
change("app.js",
'''  if (state.visualStyle === "storybook" || state.visualStyle === "candy") {''',
'''  if (isIllustratedStyle()) {''')
# No need a new font except Huninn for existing storybook/candy and Naive UI.
change("app.js",
'''  const names = { editorial: "Editorial", storybook: "Storybook",
    candy: "Candy Geometry", risograph: "Risograph Zine" };''',
'''  const names = {
    "editorial-light": "Editorial Light", "editorial-dark": "Editorial Dark",
    storybook: "Storybook", candy: "Candy Geometry",
    "paper-collage": "Paper Collage", "naive-city": "Naive City Sketch",
    risograph: "Risograph Zine", "taiwan-poster": "Taiwan Retro Poster",
    "field-stamp": "Field Stamp",
  };
  const choices = [
    "editorial-light", "editorial-dark", "storybook", "candy", "paper-collage",
    "naive-city", "risograph", "taiwan-poster", "field-stamp",
  ];''')
change("app.js",
'''    editorial: isZh ? "經典編輯版 · 支援深色" : "Classic · light & dark",
    storybook: isZh ? "日系繪本 · 插畫" : "Picture book · illustrated",
    candy: isZh ? "糖果色塊 · 圓潤" : "Pastel · rounded stickers",
    risograph: isZh ? "孔版印刷 · 復古" : "Print · indigo grain",''',
'''    "editorial-light": isZh ? "經典編輯 · 淺色" : "Classic · light",
    "editorial-dark": isZh ? "經典編輯 · 深色" : "Classic · dark",
    storybook: isZh ? "日系繪本 · 插畫" : "Picture book · illustrated",
    candy: isZh ? "糖果色塊 · 圓潤" : "Pastel · rounded stickers",
    "paper-collage": isZh ? "層疊剪紙 · 紙雕" : "Layered cutout · cardstock",
    "naive-city": isZh ? "歐洲手繪 · 水粉" : "Hand-drawn · gouache",
    risograph: isZh ? "孔版印刷 · 復古" : "Print · indigo grain",
    "taiwan-poster": isZh ? "台灣海報 · 網印" : "Retro poster · screenprint",
    "field-stamp": isZh ? "田野印章 · 手刻" : "Field notes · carved stamp",''')
change("app.js",
'''  const choices = Object.keys(VISUAL_PACKS).map(id => `<button type="button"
    class="style-option" data-style-choice="${id}" aria-pressed="${state.visualStyle === id}">''',
'''  const selectedChoice = state.visualStyle === "editorial"
    ? ((state.theme === "dark" || (state.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches))
      ? "editorial-dark" : "editorial-light")
    : state.visualStyle;
  const optionMarkup = choices.map(id => `<button type="button"
    class="style-option" data-style-choice="${id}" aria-pressed="${selectedChoice === id}">''')
change("app.js",
'''      aria-label="${isZh ? "可選網站風格" : "Available visual styles"}">${choices}</div>''',
'''      aria-label="${isZh ? "九種可選網站外觀" : "Nine available appearances"}">${optionMarkup}</div>''')
change("app.js",
'''  const defaultStyle = VISUAL_STYLES.has(state.data.ui.visualStyle)
    ? state.data.ui.visualStyle : "editorial";''',
'''  const defaultStyle = VISUAL_STYLES.has(state.data.ui.visualStyle)
    ? state.data.ui.visualStyle : "editorial";
  const defaultAppearance = defaultStyle === "editorial"
    ? (state.data.ui.theme === "dark" ? "editorial-dark" : "editorial-light")
    : defaultStyle;''')
change("app.js",'''${names[defaultStyle]}''','''${names[defaultAppearance]}''')
change("app.js",
'''        <div><p class="eyebrow">Appearance</p><h2>${({storybook:"Storybook",candy:"Candy Geometry",risograph:"Risograph Zine"})[state.visualStyle]} · Light only</h2></div>''',
'''        <div><p class="eyebrow">Appearance</p><h2>${names[state.visualStyle]} · Light only</h2></div>''')
# Fix chooser selection of aliases. Already stylePreference is per trip.
change("app.js",
'''async function chooseLocalStyle(choice) {
  if (choice !== "default" && !VISUAL_STYLES.has(choice)) return false;
  const next = choice === "default" ? null : choice;''',
'''async function chooseLocalStyle(choice) {
  const editorialChoice = choice === "editorial-light" || choice === "editorial-dark";
  if (choice !== "default" && !VISUAL_STYLES.has(choice) && !editorialChoice) return false;
  const next = choice === "default" ? null : editorialChoice ? "editorial" : choice;
  if (editorialChoice) {
    state.theme = choice === "editorial-dark" ? "dark" : "light";
    await TravelLiteStorage.set(tripKey("theme"), state.theme);
  } else if (choice === "default") {
    await TravelLiteStorage.remove(tripKey("theme"));
    state.theme = state.data.ui.theme || "system";
  }''')
change("app.js",
'''  root.querySelector(next === null ? "[data-style-reset]" :
    '[data-style-choice="' + next + '"]')?.focus({ preventScroll: true });''',
'''  root.querySelector(next === null ? "[data-style-reset]" :
    '[data-style-choice="' + choice + '"]')?.focus({ preventScroll: true });''')
# Render function names now 9 choices; reset default remains.
# Add styles in head; use prefix to preserve link priority.
change("index.html",
'''    <link id="risograph-style" rel="stylesheet" href="./risograph-theme.css" disabled />''',
'''    <link id="risograph-style" rel="stylesheet" href="./risograph-theme.css" disabled />
    <link id="paper-collage-style" rel="stylesheet" href="./paper-collage-theme.css" disabled />
    <link id="naive-city-style" rel="stylesheet" href="./naive-city-theme.css" disabled />
    <link id="taiwan-poster-style" rel="stylesheet" href="./taiwan-poster-theme.css" disabled />
    <link id="field-stamp-style" rel="stylesheet" href="./field-stamp-theme.css" disabled />''')
change("sw.js",'''const CACHE = "travel-lite-shell-v27-style-settings";''',
'''const CACHE = "travel-lite-shell-v28-nine-looks";''')
change("sw.js",'''  "./risograph-theme.css",''',
'''  "./risograph-theme.css",
  "./paper-collage-theme.css",
  "./naive-city-theme.css",
  "./taiwan-poster-theme.css",
  "./field-stamp-theme.css",''')
change("sw.js",'''  "./assets/risograph/marker.svg",''',
'''  "./assets/risograph/marker.svg",
  "./assets/paper-collage/hero.svg",
  "./assets/paper-collage/marker.svg",
  "./assets/paper-collage/street.svg",
  "./assets/naive-city/hero.svg",
  "./assets/naive-city/marker.svg",
  "./assets/taiwan-poster/hero.svg",
  "./assets/taiwan-poster/marker.svg",
  "./assets/field-stamp/hero.svg",
  "./assets/field-stamp/marker.svg",''')
p=r/'style-settings.css'
css=p.read_text()
css+='''

/* All nine appearances fit as a 2-column mobile / 3- or 4-column desktop grid. */
.style-options {grid-template-columns:repeat(2,minmax(0,1fr));}
.style-preview--editorial-light {background:#EDEEE9; border-radius:3px;}
.style-preview--editorial-light > span {height:27px;background:#687F74;border-radius:2px;}
.style-preview--editorial-light > span:nth-child(2) {height:35px;background:#BCD0C2;}
.style-preview--editorial-light > span:nth-child(3) {height:20px;background:#4B675E;}
.style-preview--editorial-dark {background:#202B29;border:1px solid #9EB5A5;border-radius:3px;}
.style-preview--editorial-dark > span {height:27px;background:#8EA99A;border-radius:2px;}
.style-preview--editorial-dark > span:nth-child(2) {height:35px;background:#526E62;}
.style-preview--editorial-dark > span:nth-child(3) {height:20px;background:#C8DBCF;}
.style-preview--paper-collage {background:#FAF3E4;}
.style-preview--paper-collage > span {background:#D98D87;border-radius:3px;transform:rotate(-8deg);height:32px;box-shadow:3px 3px #DAC8B4;}
.style-preview--paper-collage > span:nth-child(2) {background:#9FCCD0;height:38px;transform:rotate(6deg);}
.style-preview--paper-collage > span:nth-child(3) {background:#467C78;height:24px;transform:rotate(-4deg);}
.style-preview--naive-city {background:#FAF5E9;}
.style-preview--naive-city > span {background:#D88F87;border:2px solid #233C65;border-radius:9px 2px 6px 3px;height:30px;transform:rotate(-7deg);}
.style-preview--naive-city > span:nth-child(2) {background:#E3B15A;height:42px;transform:rotate(5deg);}
.style-preview--naive-city > span:nth-child(3) {background:#8CA78C;height:24px;transform:rotate(-3deg);}
.style-preview--taiwan-poster {background:#E3AF50;border:1px solid #143C56;border-radius:1px;}
.style-preview--taiwan-poster > span {background:#143C56;height:40px;border-radius:0;}
.style-preview--taiwan-poster > span:nth-child(2) {height:31px;background:#B64D33;}
.style-preview--taiwan-poster > span:nth-child(3) {height:46px;background:#143C56;}
.style-preview--field-stamp {background:#F7F0E3;border:1px dashed #293C31;border-radius:1px;}
.style-preview--field-stamp > span {height:29px;background:#293C31;border-radius:0;transform:rotate(3deg);}
.style-preview--field-stamp > span:nth-child(2) {height:38px;background:#A76D52;transform:rotate(-5deg);}
.style-preview--field-stamp > span:nth-child(3) {height:23px;background:#617E81;transform:rotate(7deg);}
@media(min-width:700px) and (max-width:1050px) {
  .style-options {grid-template-columns:repeat(3,minmax(0,1fr));}
}
@media(min-width:1051px) {
  .style-options {grid-template-columns:repeat(3,minmax(0,1fr));}
}
'''
p.write_text(css)
print("Registered 8 built-in packs with 9 explicit visual appearance choices.")
