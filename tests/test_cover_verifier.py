"""Negative controls for independent verifier (synthetic pixels, NOT visual acceptance)."""
import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

SOURCE=Path(__file__).resolve().parents[1]/'tools/artwork/verify-covers.py'
spec=importlib.util.spec_from_file_location('cover_verifier',SOURCE)
V=importlib.util.module_from_spec(spec);spec.loader.exec_module(V)
RECIPES=json.loads((Path(__file__).resolve().parents[1]/'artwork/quality/cover-recipes.v1.json').read_text())

class CoverVerifierSafetyTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();cls.root=Path(cls.tmp.name)
  cls.trip={'trip':{'overviewArtwork':{'subjectIds':['fireworks','yokai','kumano','onsen']}},
   'days':[{'items':[{'id':'fireworks','type':'event'},{'id':'yokai','type':'event'},
     {'id':'kumano','type':'place'},{'id':'onsen','type':'place'}]}]}
  cls.variants=[];cls.jobs={'jobs':[]}
  dt='2026-11-20T00:00:00+08:00'
  for i,rec in enumerate(RECIPES['recipes']):
   style=rec['id'];src=f'native/{style}.jpg';pub=f'published/{style}.webp'
   (cls.root/'native').mkdir(exist_ok=True);(cls.root/'published').mkdir(exist_ok=True)
   image=Image.new('RGB',(1536,864),((i*13)%255,(i*33)%255,(i*67)%255));image.save(cls.root/src,quality=90)
   image.resize((960,405)).save(cls.root/pub,format='WEBP',quality=85)
   a=V.h((cls.root/src).read_bytes());b=V.h((cls.root/pub).read_bytes())
   rcpt={'version':1,'styleId':style,'sourceType':'independent-generation','imageSHA256':a,
    'promptSHA256':'a'*64,'requestSHA256':'b'*64,'recipeSHA256':'c'*64,'model':'gpt-image-2.5-sunburst-2026-09-08','createdAt':dt}
   judge={'styleId':style,'imageSHA256':a,'model':'gpt-6.2-astra','responseId':'resp_unit_fixture','assessedAt':dt,
    'scores':{'styleMatch':5,'composition':5,'sceneClarity':5,'sceneFidelity':5},
    'subjectCoverage':{x:True for x in ['fireworks','yokai','kumano','onsen']},'inventedText':False,'misleadingDocumentary':False}
   human={'imageSHA256':a,'reviewer':'synthetic-fixture','reviewedAt':dt,'approved':True,'sourceRightsChecked':True}
   for folder,payload in [('receipt',rcpt),('judge',judge),('human',human)]:
    (cls.root/folder).mkdir(exist_ok=True)
    (cls.root/f'{folder}/{style}.json').write_text(json.dumps(payload))
   cls.variants.append({'styleId':style,'sourceImage':src,'publishedImage':pub,'sourceSHA256':a,'publishedSHA256':b,
    'generationMode':'individual-request','generationReceipt':f'receipt/{style}.json',
    'judgeReport':f'judge/{style}.json','humanReview':f'human/{style}.json'})
   cls.jobs['jobs'].append({'styleId':style,'sourceType':'independent-generation',
    'promptSHA256':'a'*64,'requestSHA256':'b'*64,'recipeSHA256':'c'*64,'model':rcpt['model']})

 @classmethod
 def tearDownClass(cls):cls.tmp.cleanup()
 def check(self, variants=None,trip=None,jobs=None):
  return V.inspect(self.root,trip or self.trip,self.RECIPES if hasattr(self,'RECIPES') else RECIPES,
                   variants if variants is not None else self.variants,jobs if jobs is not None else self.jobs)
 def test_protocol_fixture_passes_only_when_all_external_attestations_exist(self):
  # This synthetic fixture tests parser/gates, not real artistic quality.
  self.assertEqual(self.check()['status'],'PASS')
 def test_independence_atlas_crop_is_rejected(self):
  bad=copy.deepcopy(self.variants);bad[1]['atlasSlice']=1;bad[1]['derivedFromAtlas']=True
  result=self.check(bad);self.assertEqual(result['status'],'FAIL')
  self.assertIn('E_ATLAS_CROP_NOT_INDEPENDENT',result['styles'][1]['failures'])
 def test_low_native_resolution_is_rejected_even_with_large_published_file(self):
  bad=copy.deepcopy(self.variants);bad[2]['sourceImage']=bad[2]['publishedImage'];bad[2]['sourceSHA256']=bad[2]['publishedSHA256']
  result=self.check(bad)
  self.assertIn('E_NATIVE_RESOLUTION',result['styles'][2]['failures'])
 def test_missing_generation_receipt_cannot_pass(self):
  bad=copy.deepcopy(self.variants);bad[3]['generationReceipt']='missing.json'
  self.assertIn('E_GENERATION_RECEIPT_MISSING',self.check(bad)['styles'][3]['failures'])
 def test_duplicate_native_files_are_rejected(self):
  bad=copy.deepcopy(self.variants);bad[3]['sourceImage']=bad[4]['sourceImage'];bad[3]['sourceSHA256']=bad[4]['sourceSHA256']
  self.assertIn('E_DUPLICATE_NATIVE_ASSETS',self.check(bad)['globalErrors'])
 def test_missing_judge_is_pending_not_pass(self):
  bad=copy.deepcopy(self.variants);bad[6]['judgeReport']='missing.json'
  self.assertEqual(self.check(bad)['styles'][6]['status'],'PENDING')
 def test_missing_human_is_pending_not_pass(self):
  bad=copy.deepcopy(self.variants);bad[7]['humanReview']='missing.json'
  self.assertEqual(self.check(bad)['styles'][7]['status'],'PENDING')
 def test_stale_human_review_is_rejected(self):
  bad=copy.deepcopy(self.variants);bad[7]['sourceSHA256']='0'*64
  self.assertIn('E_NATIVE_HASH_MISMATCH',self.check(bad)['styles'][7]['failures'])
 def test_invalid_source_id_fails_global(self):
  t=copy.deepcopy(self.trip);t['trip']['overviewArtwork']['subjectIds']=['unknown']
  self.assertIn('E_SELECTED_SUBJECT_IDS',self.check(trip=t)['globalErrors'])
 def test_all_styles_required(self):
  bad=copy.deepcopy(self.variants);bad.pop()
  self.assertIn('E_STYLE_COVERAGE',self.check(bad)['globalErrors'])
 def test_no_generation_job_means_pending(self):
  self.assertEqual(self.check(jobs={'jobs':[]})['status'],'PENDING')

if __name__=='__main__':unittest.main()
