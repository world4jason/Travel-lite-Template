"""Whitelist six implemented Style Packs; preserve Editorial / older-pack behavior."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
packs={
 'quiet-linocut':{'name':'Quiet Linocut','zh':'極簡版刻 · 安靜留白','en':'Linocut · quiet margins','bg':'#F4EDDD','motion':False},
 'doodle-memory-grid':{'name':'Doodle Memory Grid','zh':'九宮格 · 手繪塗鴉','en':'Nine-grid · doodle journal','bg':'#FBF6EA','motion':False},
 'crayon-journal':{'name':'Crayon Journal','zh':'蠟筆日記 · 小場景','en':'Crayon · mini memory','bg':'#FAF2E6','motion':True},
 'painterly-editorial':{'name':'Painterly Editorial','zh':'水粉筆觸 · 柔彩','en':'Gouache · airy editorial','bg':'#F4F7F1','motion':False},
 'geometric-print':{'name':'Geometric Print','zh':'硬邊幾何 · 色版','en':'Hard-edge · flat polygons','bg':'#F5F0E5','motion':False},
 'quiet-acrylic':{'name':'Quiet Acrylic','zh':'留白小主體 · 細線','en':'Sparse · acrylic cover','bg':'#FCFAF3','motion':False},
}
def replace(file,old,new):
 p=R/file
 s=p.read_text()
 if old not in s:raise RuntimeError(f'Cannot locate needle in {file}: {old[:120]}')
 p.write_text(s.replace(old,new,1))
def append(file,text):
 p=R/file;p.write_text(p.read_text()+text)

css_ids=['storybook-style','candy-style','risograph-style','paper-collage-style',
 'naive-city-style','taiwan-poster-style','field-stamp-style']
replace('app.js',
 '  "field-stamp": { css: ["storybook-style", "field-stamp-style"], lightOnly: true, timeline: true, motion: false },\n});',
 '  "field-stamp": { css: ["storybook-style", "field-stamp-style"], lightOnly: true, timeline: true, motion: false },\n'+
 '\n'.join(f'  "{id}": {{ css: ["storybook-style", "{id}-style"], lightOnly: true, timeline: true, motion: {str(p["motion"]).lower()} }},' for id,p in packs.items())+'\n});')
replace('app.js',
 '  "taiwan-poster": "#F5E7C4", "field-stamp": "#F7F0E3" })[state.visualStyle] || "#f5f6f2";',
 '  "taiwan-poster": "#F5E7C4", "field-stamp": "#F7F0E3",\n'+
 '\n'.join(f'  "{id}": "{p["bg"]}",' for id,p in packs.items())[:-1]+
 ' })[state.visualStyle] || "#f5f6f2";')
replace('app.js',
 '    "paper-collage-style", "naive-city-style", "taiwan-poster-style", "field-stamp-style"]) {',
 '    "paper-collage-style", "naive-city-style", "taiwan-poster-style", "field-stamp-style",\n'+
 '    '+', '.join('"'+id+'-style"' for id in packs)+']) {')
replace('app.js',
 'if (["storybook", "candy", "naive-city"].includes(state.visualStyle)) {',
 'if (["storybook", "candy", "naive-city", "doodle-memory-grid", "crayon-journal"].includes(state.visualStyle)) {')
replace('app.js',
 '    "field-stamp": "Field Stamp",\n  };',
 '    "field-stamp": "Field Stamp",\n'+
 '\n'.join(f'    "{id}": "{p["name"]}",' for id,p in packs.items())+'\n  };')
replace('app.js',
 '    "naive-city", "risograph", "taiwan-poster", "field-stamp",\n  ];',
 '    "naive-city", "risograph", "taiwan-poster", "field-stamp",\n'+
 '    '+', '.join('"'+id+'"' for id in packs)+',\n  ];')
replace('app.js',
 '    "field-stamp": isZh ? "田野印章 · 手刻" : "Field notes · carved stamp",\n  };',
 '    "field-stamp": isZh ? "田野印章 · 手刻" : "Field notes · carved stamp",\n'+
 '\n'.join(f'    "{id}": isZh ? "{p["zh"]}" : "{p["en"]}",' for id,p in packs.items())+'\n  };')
replace('app.js',
 '      aria-label="${isZh ? "九種可選網站外觀" : "Nine available appearances"}">${optionMarkup}</div>',
 '      aria-label="${isZh ? "十五種可選網站外觀" : "Fifteen available appearances"}">${optionMarkup}</div>')

replace('index.html','    <link id="field-stamp-style" rel="stylesheet" href="./field-stamp-theme.css" disabled />',
 '    <link id="field-stamp-style" rel="stylesheet" href="./field-stamp-theme.css" disabled />\n'+
 '\n'.join(f'    <link id="{id}-style" rel="stylesheet" href="./{id}-theme.css" disabled />' for id in packs))
replace('sw.js','const CACHE = CACHE_PREFIX + "shell-v29-nine-looks";',
 'const CACHE = CACHE_PREFIX + "shell-v30-fifteen-looks";')
replace('sw.js','  "./field-stamp-theme.css",',
 '  "./field-stamp-theme.css",\n'+
 '\n'.join(f'  "./{id}-theme.css",' for id in packs))
replace('sw.js','  "./assets/field-stamp/marker.svg",',
 '  "./assets/field-stamp/marker.svg",\n'+
 '\n'.join(f'  "./assets/{id}/{asset}.svg",' for id in packs for asset in ('hero','marker')))
for id,p in packs.items():
 append('style-settings.css',f'''
/* Real, bundled thumbnail for {p["name"]}; not a photo-derived icon. */
.style-preview--{id} {{
 background:{p["bg"]} url("./assets/{id}/marker.svg") center / auto 94% no-repeat;
 border-radius:{"1px" if id in ("quiet-linocut","geometric-print","quiet-acrylic") else "9px"};
 border:1px solid #67726D;
}}
.style-preview--{id} > span {{ opacity:0; }}
''')
print('Six new style choices installed; there are 14 Style Packs and 15 appearances.')
