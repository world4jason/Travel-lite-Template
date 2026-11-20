/** Independent visual judge — does NOT import generation prompts or call generator. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
const arg=(x,def)=>{const i=process.argv.indexOf('--'+x);return i<0?def:process.argv[i+1]};
const within=x=>{
 if(typeof x!=='string'||!x||path.isAbsolute(x)||x.includes('..')||x.includes('\\'))throw Error('Unsafe path');
 const y=path.resolve(root,x);if(!y.startsWith(root+path.sep))throw Error('Not within repo'); return y;
};
const schema={type:'object',additionalProperties:false,required:['scores','subjectCoverage','inventedText','misleadingDocumentary','issues','reason'],properties:{
 scores:{type:'object',additionalProperties:false,required:['styleMatch','composition','sceneClarity','sceneFidelity'],properties:{
  styleMatch:{type:'integer'},composition:{type:'integer'},sceneClarity:{type:'integer'},sceneFidelity:{type:'integer'}
 }},
 subjectCoverage:{type:'object',additionalProperties:false,required:['fireworks','yokai','kumano','onsen'],properties:{
  fireworks:{type:'boolean'},yokai:{type:'boolean'},kumano:{type:'boolean'},onsen:{type:'boolean'}
 }},
 inventedText:{type:'boolean'},misleadingDocumentary:{type:'boolean'},issues:{type:'array',items:{type:'string'}},reason:{type:'string'}
}};
async function main(){
 if(!process.argv.includes('--execute'))throw Error('No judging request sent. Use --execute with OPENAI_API_KEY and an independent judge model');
 const key=process.env.OPENAI_API_KEY;if(!key)throw Error('Missing OPENAI_API_KEY');
 const judgeModel=arg('model','gpt-6.2-astra');
 const manifest=JSON.parse(await readFile(within(arg('manifest','artwork/quality/cover-output-manifest.json')),'utf8'));
 const recipe=JSON.parse(await readFile(within(arg('recipes','artwork/quality/cover-recipes.v1.json')),'utf8'));
 const registry=new Map(recipe.recipes.map(r=>[r.id,r]));
 const selected=arg('style',null); const variants=selected?manifest.variants.filter(v=>v.styleId===selected):manifest.variants;
 if(!variants.length)throw Error('Nothing to review');
 for (const v of variants){
  const style=registry.get(v.styleId);if(!style)throw Error('Unknown style');
  const bytes=await readFile(within(v.sourceImage));
  const imageSHA256=sha(bytes);
  if(v.sourceSHA256!==imageSHA256)throw Error('Source hash does not match manifest');
  const ext=path.extname(v.sourceImage).toLowerCase();
  const media={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[ext];
  if(!media)throw Error('Use PNG/JPEG/WebP full-resolution source for judge: '+v.styleId);
  const receipt=JSON.parse(await readFile(within(v.generationReceipt),'utf8'));
  if(receipt.model===judgeModel)throw Error('Generator and judge must use different model');
  const question=[
   'You are a BLIND INDEPENDENT image evaluator. You did NOT generate this image; do not trust metadata, creator statements or generation prompt.',
   'Grade ONLY visible pixels against the independently versioned reference rubric below. Return strict JSON; scores are integers 1-5.',
   'Unknown or ambiguous details should NOT be assumed present. You MUST independently determine whether each required subject is visible.',
   'The image is a stylized MEMORY collage; fantasy yokai motifs are permitted as artistic symbolism but do not imply these costumes are documentary.',
   'Style Pack: '+style.id+'. Target medium: '+style.medium+'. Target composition: '+style.composition,
   'MANDATORY observable style traits: '+style.must.join('; '),
   'FORBIDDEN visual traits: '+style.avoid.join('; '),
   'Four must-be-recognizable travel memories: '+recipe.requiredSubjects.map(x=>x.label+' ('+x.visualEvidence+')').join(' / '),
   'Flag invented text/logos and any misleading depiction that claims impossible simultaneous documentary events.',
   'For fidelity score, use known cultural/scene structure only; absent licensed reference photos cannot prove site-photo fidelity, so score conservatively.',
   'Provide reason and issues concretely. No automatic PASS claim.'
  ].join('\n');
  const request={model:judgeModel,input:[{role:'user',content:[{type:'input_text',text:question},
   {type:'input_image',image_url:'data:'+media+';base64,'+bytes.toString('base64'),detail:'high'}]}],
   text:{format:{type:'json_schema',name:'cover_visual_judgment',strict:true,schema}},max_output_tokens:1300};
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});
  const json=await response.json();if(!response.ok)throw Error(JSON.stringify(json.error||json).slice(0,600));
  const content=json.output?.flatMap(x=>x.content||[])?.find(x=>x.type==='output_text')?.text;
  if(!content)throw Error('Judge produced no structured output for '+v.styleId);
  const evalData=JSON.parse(content);
  const report={schema:'independent-visual-judge-v1',styleId:v.styleId,imageSHA256,
   model:judgeModel,responseId:json.id||null,assessedAt:new Date().toISOString(),
   rubricVersion:recipe.version, ...evalData};
  const dest=within('artwork/reviews/model/'+v.styleId+'.json');
  await mkdir(path.dirname(dest),{recursive:true});
  await writeFile(dest,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({style:v.styleId,judgeModel,responseId:report.responseId,file:dest,scores:evalData.scores}));
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
