/** Publisher handoff: NEVER bypass the standalone Python verification tool. */
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const arg=(name,def)=>{const i=process.argv.indexOf('--'+name);return i<0?def:process.argv[i+1]};
const file=x=>{if(typeof x!=='string'||path.isAbsolute(x)||x.includes('..'))throw Error('Bad local path');const out=path.resolve(root,x);if(!out.startsWith(root+path.sep))throw Error('Path leaves root');return out};

async function main(){
 const report='artwork/quality/cover-verification-report.json';
 const probe=spawnSync('python3',['tools/artwork/verify-covers.py','--root',root,'--report',report],{cwd:root,encoding:'utf8'});
 if(probe.error)throw probe.error;
 if(probe.status!==0)throw Error('Independent verification did NOT pass; publishing blocked. '+(probe.stdout||probe.stderr||'').trim());
 const qa=JSON.parse(await readFile(file(report),'utf8'));
 if(qa.status!=='PASS'||qa.releaseAllowed!==true||qa.counts.PASS!==15||qa.counts.FAIL||qa.counts.PENDING)throw Error('No release-grade 15/15 verification report');
 const manifest=JSON.parse(await readFile(file('artwork/quality/cover-output-manifest.json'),'utf8'));
 const trip=JSON.parse(await readFile(file('trip.json'),'utf8'));
 if(!manifest.variants || manifest.variants.length!==15)throw Error('Exactly 15 independent cover variants required');
 if(!trip.trip.overviewArtwork?.subjectIds?.length)throw Error('Owner did not select subjects');
 const images=manifest.variants.map(v=>({
  src:'./'+v.publishedImage,
  alt:v.alt||('Artistic travel-memory cover for '+v.styleId+'; this is not a documentary photograph.'),
  styleId:v.styleId,
  fit:v.fit||'cover', focalPoint:v.focalPoint||'center'
 }));
 if(images.some(x=>x.src.includes('atlas')||x.src.includes('contact-sheet')))throw Error('Cannot publish atlas crop as independent image');
 if(!process.argv.includes('--execute')){
  process.stdout.write(JSON.stringify({mode:'DRY_RUN_VERIFIED',releaseAllowed:true,images:images.length,notice:'Add --execute to actually update trip.json'},null,2)+'\n');return;
 }
 trip.trip.overviewArtwork.images=images;
 const revision=arg('revision',null);
 if(!revision)throw Error('Explicit --revision required when publishing. Rerun with --revision <new-version>');
 trip.trip.revision=revision;trip.trip.updatedAt=new Date().toISOString();
 await writeFile(file('trip.json'),JSON.stringify(trip,null,2)+'\n');
 process.stdout.write('Published 15 VERIFIED independent cover images to trip.json. Git commit must include images, receipts, reviews, reports.\n');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
