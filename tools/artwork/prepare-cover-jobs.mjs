/** Standalone publisher utility: produce independently reproducible cover jobs. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const sha = x => createHash('sha256').update(x).digest('hex');
const canonical = x => JSON.stringify(x);
const isArg = (name, fallback) => { const i = process.argv.indexOf('--'+name); return i >= 0 ? process.argv[i+1] : fallback; };
export const parse = data => typeof data === 'string' ? JSON.parse(data) : data;

export function prepare(trip, recipes, { styles = 'all', model = 'gpt-image-2.5-sunburst-2026-09-08' } = {}) {
  if (!trip?.trip?.id || !trip?.days?.length) throw Error('Invalid trip source');
  const all = trip.days.flatMap(d => (d.items || []).map(i => ({id:i.id,date:d.date,title:i.title,type:i.type})));
  const byId = new Map(all.map(i => [i.id,i]));
  const ids = trip.trip.overviewArtwork?.subjectIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 6 || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) {
    throw Error('Owner-curated subjectIds must refer to 1-6 unique real trip items');
  }
  if (!Array.isArray(recipes?.recipes) || recipes.recipes.length !== 15 || recipes.version !== 'cover-recipes-v1') throw Error('Locked 15-pack recipe registry required');
  const known = new Set(recipes.recipes.map(x => x.id));
  if (known.size !== 15) throw Error('Duplicate recipe ID');
  const idsToBuild = styles === 'all' ? [...known] : styles.split(',').filter(Boolean);
  if (idsToBuild.some(id => !known.has(id))) throw Error('Unknown Style Pack recipe ID');
  const selected = ids.map(id => byId.get(id));
  const recipeSHA = sha(canonical(recipes));
  const tripFactsSHA = sha(canonical(selected));
  const jobs = recipes.recipes.filter(r => idsToBuild.includes(r.id)).map(recipe => {
    const prompt = [
      'Independent high-resolution TRIP COVER image. Generate one complete image in THIS single call; never create grids, contact sheets or atlas crops.',
      'Trip owner explicitly chose the following scheduled experiences (not an automatic ranking):',
      ...selected.map(i => `- ${i.date}: ${i.title} [${i.type}, ID=${i.id}]`),
      'Visual subject constraints:',
      ...recipes.requiredSubjects.map(s=>`- ${s.label}: ${s.visualEvidence}`),
      'Visual medium: '+recipe.medium,
      'Composition: '+recipe.composition,
      'MUST express:',...recipe.must.map(s=>' - '+s),
      'MUST avoid:',...recipe.avoid.map(s=>' - '+s),
      'Scene and truth requirements:', ...recipes.scenePolicy.map(s=>' - '+s),
      'Deliverable: exactly ONE 1536x864 landscape frame, no text, no borders, no logos, no CSS, no sprite grid.',
      'Match the specified material and composition, not merely its colors. This is travel MEMORY artwork and not a documentary photo.'
    ].join('\n');
    const request = { model, n: 1, size: '1536x864', quality: 'high', output_format: 'webp', prompt };
    return { styleId: recipe.id, subjectIds: ids, model, output: `artwork/generated/${recipe.id}.webp`,
      recipeSHA256: sha(canonical(recipe)), promptSHA256: sha(prompt), requestSHA256: sha(canonical(request)),
      request, sourceType: 'independent-generation', expectedNative: { width: 1536,height:864 } };
  });
  return { version: 1, tripId:trip.trip.id, generationMethod:'one-independent-request-per-style',
    recipeVersion: recipes.version, recipeRegistrySHA256:recipeSHA, selectedFactsSHA256:tripFactsSHA,
    selectedMoments:selected, stylesRequested:idsToBuild, jobs };
}

async function main(){
  const tripFile=path.resolve(base,isArg('trip','trip.json'));
  const recipesFile=path.resolve(base,isArg('recipes','artwork/quality/cover-recipes.v1.json'));
  const outputFile=path.resolve(base,isArg('out','artwork/generation/cover-jobs.json'));
  const [trip,recipes]=await Promise.all([readFile(tripFile,'utf8'),readFile(recipesFile,'utf8')]);
  const jobs=prepare(parse(trip),parse(recipes),{styles:isArg('styles','all'),model:isArg('model','gpt-image-2.5-sunburst-2026-09-08')});
  await mkdir(path.dirname(outputFile),{recursive:true});
  await writeFile(outputFile,JSON.stringify(jobs,null,2)+'\n');
  process.stdout.write(JSON.stringify({output:outputFile,model:jobs.jobs[0].model,styles:jobs.jobs.length,recipeSHA256:jobs.recipeRegistrySHA256,selectedMoments:jobs.selectedMoments.map(x=>x.title)},null,2)+'\n');
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
