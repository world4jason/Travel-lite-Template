"""Manifest and provenance audit for second six Style Packs. Idempotently re-runnable."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
P={
"quiet-linocut":("Quiet Linocut","linocut-risograph",["2–3 spot inks on torn-edged paper","small lower-right subject and bottom horizon","wide upper-left negative space; engraved rough ink","static editorial type"]),
"doodle-memory-grid":("Doodle Memory Grid","crayon-pencil",["exactly nine decoratively drawn items in loose 3-by-3 alignment","crayon/colored pencil grain and imperfect outlines","no nine-fake-destinations inference","functional itinerary remains its real stop count"]),
"crayon-journal":("Crayon Journal","grainy-crayon",["2–5 horizontal memory objects, not nine-grid","opaque waxy pigment with paper holes and crayon hatching","gentle movement with reduced-motion support"]),
"painterly-editorial":("Painterly Editorial","gouache-acrylic",["airy cool pastel palette","matte gouache/acrylic brush grain and dry edges","one loose composition not crowded cards","no copied photo halves"]),
"geometric-print":("Geometric Print","flat-polyhedral-print",["hard-edged polygon planes without outlines or shadows in SVG","5–6 muted ink planes plus paper base","structured negative space and abstract subject","no copied pose or labels"]),
"quiet-acrylic":("Quiet Acrylic","sparse-acrylic",["tiny 10–20% drawn focal object on 80% paper","thin wavering ink and sparse acrylic fills","no crayon, collage or heavy gouache","very restrained book-cover editorial layout"])
}
for id,(title,material,materialRules) in P.items():
 d=R/'style-packs'/id;d.mkdir(parents=True,exist_ok=True)
 config={
   "schemaVersion":1,"id":id,"displayName":title,"sourceBriefId":id,
   "sourceBriefPath":f"../../style-generator/examples/{id}.json",
   "generatedPromptPath":f"../../style-generator/generated-prompts/{id}.md",
   "stage":"implemented-reviewed","implementationTier":"new-style-pack",
   "base":"storybook","visualStyle":id,"photoProvided":False,
   "sourceColorMeasurements":False,
   "lightOnly":True,"motion":"gentle-and-reducible" if id=="crayon-journal" else "none",
   "css":["../../storybook-theme.css",f"../../{id}-theme.css"],
   "assetDirectory":f"../../assets/{id}",
   "assets":sorted(p.name for p in (R/'assets'/id).glob("*.svg")),
   "browserPreviews":["../previews/"+id+"-"+kind+".png" for kind in ["mobile","desktop","day-mobile"]],
   "materialRules":materialRules,
   "sourceVsOutputBoundary":"Prompts referred to image-to-poster tasks. The trip sites have no destination source photograph; 3:4, split 50/50 photo panels, exact caption words, source-only features and fixed magazine labels were deliberately excluded. Any custom HEX is a design proposal, not measured from a real travel photo.",
   "acceptanceTests":["tests/second-prompt-batch.spec.mjs","tests/second-batch-manifests.test.mjs","scripts/verify-style-parity.mjs"]
 }
 (d/'manifest.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
 print('MANIFEST',id,len(config['assets']))
