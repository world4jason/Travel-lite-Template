#!/usr/bin/env python3
"""INDEPENDENT, FAIL-CLOSED verification of published travel-cover artwork.

This tool NEVER imports the generator, NEVER generates pictures, NEVER writes approvals.
It verifies output/provenance + independent reviewer judgments, not aesthetic quality alone.
Requires Pillow (pip install Pillow). Exit 0 only when all release gates pass.
"""
import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
try:
    from PIL import Image, UnidentifiedImageError
except ImportError as exc:
    raise SystemExit('Pillow missing. Install with: python3 -m pip install Pillow') from exc

RECIPE_FILE = 'artwork/quality/cover-recipes.v1.json'
STYLE_THRESHOLD = 4
CLARITY_THRESHOLD = 4
SOURCE_MIN = (1536, 864)
PUBLISH_MIN = (960, 405)
SUPPORTED = {'PNG', 'JPEG', 'WEBP', 'AVIF'}
SHA_RE = re.compile(r'^[a-f0-9]{64}$')


def h(b): return hashlib.sha256(b).hexdigest()
def read_json(p): return json.loads(p.read_text('utf-8'))
def resolve(root, relative):
    if not isinstance(relative, str) or not relative or '\\' in relative or re.match(r'^[a-zA-Z][\w+.-]*:', relative):
        raise ValueError('Unsafe/missing path')
    if Path(relative).is_absolute() or '..' in Path(relative).parts:
        raise ValueError('Absolute/traversing path')
    path = (root / relative.lstrip('./')).resolve()
    if not path.is_relative_to(root.resolve()): raise ValueError('Outside repository root')
    return path


def image_info(root, source, min_dimensions, errors, prefix):
    try:
        file = resolve(root, source)
        if not file.is_file():
            errors.append(prefix+'_FILE_MISSING'); return None
        raw=file.read_bytes()
        with Image.open(file) as im:
            fmt=im.format; width,height=im.size
            im.verify()  # verify encoded pixels when supported
        if fmt not in SUPPORTED: errors.append(prefix+'_FORMAT')
        if width<min_dimensions[0] or height<min_dimensions[1]: errors.append(prefix+'_RESOLUTION')
        ratio = width / height if height else 0
        if ratio<1.4 or ratio>2.5: errors.append(prefix+'_ASPECT')
        return {'path':source,'sha256':h(raw),'bytes':len(raw),'width':width,'height':height,'format':fmt}
    except (ValueError, OSError, UnidentifiedImageError) as exc:
        errors.append(prefix+'_UNREADABLE'); return {'error':str(exc)[:200]}


def parse_iso(value):
    try:
        dt=datetime.fromisoformat(value.replace('Z','+00:00'))
        return dt.tzinfo is not None
    except (TypeError, ValueError, AttributeError):return False


def inspect(root, trip, recipes, variants, jobs=None):
    expected=[x['id'] for x in recipes['recipes']]
    recipe_map={x['id']:x for x in recipes['recipes']}
    selected=trip.get('trip',{}).get('overviewArtwork',{}).get('subjectIds',[])
    sourceIds={i.get('id') for d in trip.get('days',[]) for i in d.get('items',[])}
    globalErrors=[]
    if not isinstance(selected,list) or not (1<=len(selected)<=6) or len(set(selected))!=len(selected) or any(x not in sourceIds for x in selected):
        globalErrors.append('E_SELECTED_SUBJECT_IDS')
    registered={x.get('styleId') for x in variants if isinstance(x,dict)}
    if len(variants)!=len(expected) or registered!=set(expected) or len(registered)!=len(variants):
        globalErrors.append('E_STYLE_COVERAGE')
    if recipes.get('version')!='cover-recipes-v1' or len(expected)!=15 or len(set(expected))!=15:
        globalErrors.append('E_RECIPES_NOT_LOCKED')
    job_map={j['styleId']:j for j in (jobs or {}).get('jobs',[])}
    if jobs and jobs.get('generationMethod') != 'one-independent-request-per-style':
        globalErrors.append('E_JOBS_NOT_INDEPENDENT')
    if jobs and (len(jobs.get('jobs',[])) != len(job_map) or len(job_map) != 15):
        globalErrors.append('E_JOBS_MISSING_OR_DUPLICATED')
    allsha=[]; per=[]
    for v in variants:
        if not isinstance(v,dict):continue
        sty=v.get('styleId','unknown');err=[];pending=[]
        if sty not in recipe_map:err.append('E_UNKNOWN_STYLE')
        if 'atlasSlice' in v or v.get('derivedFromAtlas'):
            err.append('E_ATLAS_CROP_NOT_INDEPENDENT')
        source=v.get('sourceImage')
        if not source or 'atlas' in source.lower() or 'contact' in source.lower():
            err.append('E_INDEPENDENT_SOURCE_REQUIRED')
        if v.get('generationMode')!='individual-request': err.append('E_INDEPENDENT_GENERATION_UNPROVEN')
        # The native source must exist separately and be of high enough resolution;
        # an enlarged export from a small panel is not accepted as evidence.
        src=image_info(root,source,SOURCE_MIN,err,'E_NATIVE') if source else None
        pubpath=v.get('publishedImage') or v.get('src')
        published=image_info(root,pubpath,PUBLISH_MIN,err,'E_PUBLISHED') if pubpath else None
        if not pubpath:err.append('E_PUBLISHED_FILE_MISSING')
        if isinstance(src,dict) and src.get('sha256'):
            allsha.append(src['sha256'])
            if v.get('sourceSHA256')!=src['sha256']:err.append('E_NATIVE_HASH_MISMATCH')
        if isinstance(published,dict) and published.get('sha256') and v.get('publishedSHA256')!=published['sha256']:
            err.append('E_PUBLISH_HASH_MISMATCH')
        receipt_file=v.get('generationReceipt')
        receipt={}
        try:
            receipt=read_json(resolve(root,receipt_file)) if receipt_file else {}
        except (OSError, ValueError, json.JSONDecodeError): pass
        if not receipt:err.append('E_GENERATION_RECEIPT_MISSING')
        else:
            if receipt.get('styleId')!=sty or receipt.get('sourceType')!='independent-generation':err.append('E_RECEIPT_WRONG_PROVENANCE')
            if src and receipt.get('imageSHA256')!=src.get('sha256'):err.append('E_RECEIPT_WRONG_IMAGE')
            if not parse_iso(receipt.get('createdAt')):err.append('E_RECEIPT_TIME')
            if not receipt.get('promptSHA256') or not receipt.get('requestSHA256') or not receipt.get('recipeSHA256'):
                err.append('E_RECEIPT_INCOMPLETE')
            if sty in job_map:
                j=job_map[sty]
                for prop in ['promptSHA256','requestSHA256','recipeSHA256','model']:
                    if receipt.get(prop)!=j.get(prop):err.append('E_JOB_RECEIPT_'+prop.upper())
                if j.get('sourceType')!='independent-generation':err.append('E_INVALID_JOB_ORIGIN')
                # Recompute recipe/request/prompt hashes WITHOUT importing the publisher JS.
                compact=lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
                if sty in recipe_map and j.get('recipeSHA256') != h(compact(recipe_map[sty])):
                    err.append('E_RECIPE_HASH_NOT_VERIFIED')
                req=j.get('request') or {}
                if j.get('promptSHA256') != h(str(req.get('prompt','')).encode('utf-8')):
                    err.append('E_PROMPT_HASH_NOT_VERIFIED')
                if j.get('requestSHA256') != h(compact(req)):
                    err.append('E_REQUEST_HASH_NOT_VERIFIED')
                if j.get('subjectIds') != selected:
                    err.append('E_JOB_SELECTED_SUBJECTS_DRIFT')
        if sty not in job_map:pending.append('P_LOCKED_GENERATION_JOB_UNAVAILABLE')
        # Independent judge must not reuse the image generator's assessment.
        judge={}
        try:judge=read_json(resolve(root,v['judgeReport'])) if v.get('judgeReport') else {}
        except (OSError,ValueError,json.JSONDecodeError):pass
        if not judge:pending.append('P_INDEPENDENT_VISUAL_JUDGE_NOT_RUN')
        else:
            if judge.get('styleId')!=sty or judge.get('imageSHA256')!=(src or {}).get('sha256'):
                err.append('E_JUDGE_STALE_IMAGE')
            if judge.get('model')==receipt.get('model'):
                err.append('E_JUDGE_MODEL_NOT_INDEPENDENT')
            if not parse_iso(judge.get('assessedAt')) or not judge.get('responseId'):
                err.append('E_JUDGE_NO_EVIDENCE')
            scores=judge.get('scores') or {}
            for score in ['styleMatch','composition','sceneClarity','sceneFidelity']:
                vscore=scores.get(score)
                if not isinstance(vscore,int) or isinstance(vscore,bool) or not 1<=vscore<=5:
                    err.append('E_JUDGE_SCORE_MISSING_'+score.upper())
                elif vscore<STYLE_THRESHOLD: err.append('E_JUDGE_LOW_'+score.upper())
            if any(judge.get('subjectCoverage',{}).get(key) is not True for key in ['fireworks','yokai','kumano','onsen']):
                err.append('E_SUBJECT_MISSING')
            if judge.get('inventedText') is not False:err.append('E_INVENTED_TEXT')
            if judge.get('misleadingDocumentary') is not False:err.append('E_MISLEADING_DOCUMENTARY')
        human={}
        try:human=read_json(resolve(root,v['humanReview'])) if v.get('humanReview') else {}
        except (OSError,ValueError,json.JSONDecodeError):pass
        if not human:pending.append('P_HUMAN_REVIEW_NOT_RUN')
        else:
            if human.get('approved') is not True:pending.append('P_HUMAN_NOT_APPROVED')
            if human.get('imageSHA256')!=(src or {}).get('sha256'):err.append('E_HUMAN_REVIEW_STALE_IMAGE')
            if human.get('approved') is True and (not human.get('reviewer') or not parse_iso(human.get('reviewedAt'))):
                err.append('E_HUMAN_REVIEW_INCOMPLETE')
            if human.get('sourceRightsChecked') is not True:pending.append('P_SOURCE_RIGHTS_NOT_CHECKED')
        status='FAIL' if err else 'PENDING' if pending else 'PASS'
        per.append({'styleId':sty,'status':status,'failures':err,'pending':pending,'native':src,'published':published})
    if len(allsha)!=len(set(allsha)):globalErrors.append('E_DUPLICATE_NATIVE_ASSETS')
    status='FAIL' if globalErrors or any(x['status']=='FAIL' for x in per) else 'PENDING' if any(x['status']=='PENDING' for x in per) else 'PASS'
    return {'schema':'independent-cover-verification.v1','status':status,
      'qualityPromise':'Tests process evidence and independent review; stochastic visual quality cannot be guaranteed by prompt alone.',
      'globalErrors':globalErrors,'styles':per,'counts':{s:sum(x['status']==s for x in per) for s in ('PASS','PENDING','FAIL')},
      'releaseAllowed':status=='PASS'}


def main():
    ap=argparse.ArgumentParser(description='Fail-closed independent cover QA. No generator access, no API key needed.')
    ap.add_argument('--root',default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument('--trip',default='trip.json')
    ap.add_argument('--recipes',default=RECIPE_FILE)
    ap.add_argument('--manifest',default='artwork/quality/cover-output-manifest.json')
    ap.add_argument('--jobs',default='artwork/generation/cover-jobs.json')
    ap.add_argument('--report',default='artwork/quality/cover-verification-report.json')
    ap.add_argument('--legacy-trip-images',action='store_true',help='Audit current trip.json images as a candidate (expected FAIL for atlas)')
    args=ap.parse_args()
    root=Path(args.root).resolve(); trip=read_json(resolve(root,args.trip)); recipes=read_json(resolve(root,args.recipes))
    if args.legacy_trip_images:
        variants=[]
        for i in trip.get('trip',{}).get('overviewArtwork',{}).get('images',[]):
            variants.append({'styleId':i.get('styleId'),'src':i.get('src'),
              'sourceImage':i.get('src'),'atlasSlice':i.get('atlasSlice') if 'atlasSlice' in i else None,
              'generationMode':'legacy-asset','derivedFromAtlas': 'atlasSlice' in i})
    else:
        try:variants=read_json(resolve(root,args.manifest))['variants']
        except (OSError,ValueError,KeyError,json.JSONDecodeError):
            variants=[]
    try:jobs=read_json(resolve(root,args.jobs))
    except (OSError,ValueError,json.JSONDecodeError):jobs=None
    report=inspect(root,trip,recipes,variants,jobs)
    report['mode']='LEGACY_AUDIT' if args.legacy_trip_images else 'RELEASE'
    out=resolve(root,args.report);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':report['status'],'releaseAllowed':report['releaseAllowed'], 'counts':report['counts'],
        'globalErrors':report['globalErrors'],'report':str(out)},ensure_ascii=False))
    if report['status']=='PASS':return 0
    return 2 if report['status']=='FAIL' else 3

if __name__=='__main__': raise SystemExit(main())
