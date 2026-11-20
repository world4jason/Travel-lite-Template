/** Offline publisher only. Requires explicit --execute and OPENAI_API_KEY. Never runs in GitHub Pages. */
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const hash=x=>createHash('sha256').update(x).digest('hex');
const at=(flag,other)=>{let i=process.argv.indexOf('--'+flag);return i<0?other:process.argv[i+1]};
const inside=(relative)=>{if(typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('..')||relative.startsWith('.git/'))throw Error('Unsafe output path');let dest=path.resolve(repo,relative);if(!dest.startsWith(repo+path.sep))throw Error('Unsafe path');return dest};

async function main(){
  if(!process.argv.includes('--execute')) throw Error('No API used. Supply --execute explicitly after reviewing jobs, with OPENAI_API_KEY in the publisher environment.');
  const key=process.env.OPENAI_API_KEY; if(!key)throw Error('OPENAI_API_KEY missing');
  const jobFile=inside(at('jobs','artwork/generation/cover-jobs.json'));
  const jobs=JSON.parse(await fs.readFile(jobFile,'utf8'));
  if(jobs.generationMethod!=='one-independent-request-per-style')throw Error('Invalid job mode');
  const only=at('style',null); const selected=only?jobs.jobs.filter(x=>x.styleId===only):jobs.jobs;
  if(!selected.length)throw Error('No matching jobs');
  for (const j of selected){
    const output=inside(j.output),receipt=inside(`artwork/generation/receipts/${j.styleId}.json`);
    try{await fs.access(output);throw Error('Output already exists: '+j.styleId);}catch(e){if(e.code!=='ENOENT')throw e;}
    const r=await fetch('https://api.openai.com/v1/images/generations',{
      method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify(j.request),signal:AbortSignal.timeout(180000)
    });
    const data=await r.json();if(!r.ok||!data.data?.[0]?.b64_json)throw Error(`Image generation for ${j.styleId} failed: ${JSON.stringify(data.error||data).slice(0,400)}`);
    const bytes=Buffer.from(data.data[0].b64_json,'base64');
    if(bytes.length<1000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Expected binary WEBP');
    await fs.mkdir(path.dirname(output),{recursive:true});
    await fs.writeFile(output,bytes,{flag:'wx'});
    const doc={version:1,styleId:j.styleId,sourceType:'independent-generation',sourceImagePath:j.output,
      imageSHA256:hash(bytes),promptSHA256:j.promptSHA256,requestSHA256:j.requestSHA256,
      recipeSHA256:j.recipeSHA256,model:j.model,provider:'OpenAI',createdAt:new Date().toISOString(),
      apiResponseId:typeof data.id==='string'?data.id:null,
      note:'One image generation request per Style Pack. Independent quality verification is required; this receipt is not visual approval.'};
    await fs.mkdir(path.dirname(receipt),{recursive:true});
    await fs.writeFile(receipt,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({styleId:j.styleId,image:j.output,sha256:doc.imageSHA256,receipt}));
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
