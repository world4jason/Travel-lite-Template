/** Stage each independently generated source as a publishable asset. No API. */
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const file=relative=>{if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.split('/').includes('..'))throw Error('Unsafe path');const f=path.resolve(root,relative);if(!f.startsWith(root+path.sep))throw Error('Outside repository');return f};
async function main(){
 const jobs=JSON.parse(await readFile(file('artwork/generation/cover-jobs.json'),'utf8'));
 if(jobs.jobs.length!==15||jobs.generationMethod!=='one-independent-request-per-style')throw Error('Expected 15 independent generation jobs');
 const variants=[];
 for(const job of jobs.jobs){
  const source=file(job.output),receipt=file(`artwork/generation/receipts/${job.styleId}.json`);
  const raw=await readFile(source),info=JSON.parse(await readFile(receipt,'utf8'));
  if(digest(raw)!==info.imageSHA256||info.styleId!==job.styleId||info.requestSHA256!==job.requestSHA256)throw Error('No independent receipt for '+job.styleId);
  const dest=`assets/overview/${job.styleId}.webp`;
  // A master WEBP, not a crop of a contact sheet. A later lossless web optimize
  // step may create an additional derivative as long as original is retained.
  variants.push({styleId:job.styleId,sourceImage:job.output,publishedImage:dest,
   sourceSHA256:digest(raw),publishedSHA256:digest(raw),
   generationMode:'individual-request',generationReceipt:`artwork/generation/receipts/${job.styleId}.json`,
   judgeReport:`artwork/reviews/model/${job.styleId}.json`,humanReview:`artwork/reviews/human/${job.styleId}.json`,
   alt:`Artistic trip memory cover in ${job.styleId} style, representing the owner's four selected experiences; not a documentary photo.`,
   fit:'cover',focalPoint:'center'});
 }
 const draft={version:1,tripId:jobs.tripId,selectedFactsSHA256:jobs.selectedFactsSHA256,
  recipeRegistrySHA256:jobs.recipeRegistrySHA256,variants};
 if(!process.argv.includes('--execute')){
  console.log(JSON.stringify({status:'READY_TO_STAGE',count:variants.length,destinations:variants.map(v=>v.publishedImage),
   warning:'Pass --execute to copy master originals to assets and create pending review records.'},null,2));return;
 }
 for(const v of variants){try{await access(file(v.publishedImage));throw Error('Published output exists: '+v.publishedImage);}catch(e){if(e.code!=='ENOENT')throw e;}}
 const report=file('artwork/quality/cover-output-manifest.json');
 try{await access(report);throw Error('Output manifest already exists, refusing overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const v of variants){
  const dest=file(v.publishedImage);await mkdir(path.dirname(dest),{recursive:true});await copyFile(file(v.sourceImage),dest,constants.COPYFILE_EXCL);
  const human=file(v.humanReview);await mkdir(path.dirname(human),{recursive:true});
  const pending={schema:'human-cover-review-v1',styleId:v.styleId,approved:false,reviewer:null,
   imageSHA256:v.sourceSHA256,reviewedAt:null,sourceRightsChecked:false,notes:'Review the full-resolution original and independent judge evidence before signing.'};
  await writeFile(human,JSON.stringify(pending,null,2)+'\n',{flag:'wx'});
 }
 await mkdir(path.dirname(report),{recursive:true});await writeFile(report,JSON.stringify(draft,null,2)+'\n',{flag:'wx'});
 console.log(`Staged ${variants.length} unique originals, review templates and manifest. No QA approval granted.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
