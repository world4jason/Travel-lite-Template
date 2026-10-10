from pathlib import Path
import json,hashlib
r=Path(__file__).resolve().parent.parent
cases={
 'paper-collage':{
  'id':'paper-collage','displayName':'Paper Collage','sourceBriefId':'paper-collage',
  'base':'storybook','implementationTier':'new-style-pack','motion':'gentle-and-reducible',
  'palette':{'ivory':'#FAF3E4','ink':'#304C49','cut-paper':'#F2DCC8','teal':'#467C78','peach':'#D98D87'},
  'materialRules':['3+ visibly layered matte-cardstock cutouts','soft contact shadows only at paper surfaces','editorial type hierarchy','foreground/midground/background masking'],
  'whyNotPoster':'No photo scene, location or original-card title is asserted. Dynamic trip title remains authoritative.',
 },
 'naive-city':{
  'id':'naive-city','displayName':'Naive City Sketch','sourceBriefId':'naive-city-sketch',
  'base':'storybook','implementationTier':'new-style-pack','motion':'gentle-and-reducible',
  'palette':{'warm-paper':'#FAF5E9','navy':'#233C65','gouache-salmon':'#D88F87','ochre':'#E3B15A','gouache-green':'#8CA78C'},
  'materialRules':['wobbly broken lines and intentionally imperfect geometry','hand-drawn ordinary street without recognizable invented landmark','flat matte-gouache blocks','six-or-seven-color restrained scene with paper sky'],
  'whyNotPoster':'The source character pose and bottom handwritten caption remain illustration suggestions, not mandatory website text.',
 },
 'taiwan-poster':{
  'id':'taiwan-poster','displayName':'Taiwan Retro Poster','sourceBriefId':'taiwan-retro-poster',
  'base':'storybook','implementationTier':'new-style-pack','motion':'none',
  'palette':{'ivory':'#F5E7C4','indigo':'#143C56','ochre':'#E3AF50','vermilion':'#B64D33','olive':'#778366'},
  'materialRules':['screenprinted warm-honey field and deep navy architecture','large scene-first poster hero, oversized actual trip title and editorial microtype','paper grain and limited highlight red','scene is *generic* geometry; reference posters inspire art direction only'],
  'whyNotPoster':'No fixed MR.PARROT, year, city claim or copied signs. User reference images are art direction, not the true Tokyo/Ishigaki itinerary photo.',
 },
 'field-stamp':{
  'id':'field-stamp','displayName':'Field Stamp','sourceBriefId':'field-stamp',
  'base':'storybook','implementationTier':'new-style-pack','motion':'none',
  'palette':{'ivory':'#F7F0E3','dark-green':'#293C31','clay':'#A76D52','slate':'#617E81'},
  'materialRules':['2-4 spot color pressed-field stamp','rough hand-carved fractures and missing ink','slight ink misregistration inside artwork only','quiet typewriter field-notes rhythm and asymmetric stamp borders'],
  'whyNotPoster':'No fixed field record number, latitude, location text or invented year; actual travel fields are shown from trip.json only.',
 }
}
for name,meta in cases.items():
 dest=r/'style-packs'/name;dest.mkdir(parents=True,exist_ok=True)
 assets=sorted(p.name for p in (r/'assets'/name).glob('*.svg'))
 manifest={
 'schemaVersion':1,'id':name,'displayName':meta['displayName'],
 'sourceBriefId':meta['sourceBriefId'],
 'sourceBriefPath':'../../style-generator/examples/'+meta['sourceBriefId']+'.json',
 'generatedPromptPath':'../../style-generator/generated-prompts/'+meta['sourceBriefId']+'.md',
 'stage':'implemented-reviewed','implementationTier':meta['implementationTier'],
 'base':meta['base'],'visualStyle':name,'photoProvided':False,'sourceColorMeasurements':False,
 'lightOnly':True,'motion':meta['motion'],
 'css':['../../storybook-theme.css','../../'+name+'-theme.css'],
 'assetDirectory':'../../assets/'+name,'assets':assets,
 'palette':meta['palette'],'materialRules':meta['materialRules'],
 'sourceVsOutputBoundary':meta['whyNotPoster'],
 'acceptanceTests':['tests/nine-looks.spec.mjs','tests/four-pack-manifests.test.mjs'],
 }
 (dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(name,'manifest',len(assets),'SVG')
