/** Independent browser audit, not an image generator or substitute for human review. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const trip=JSON.parse(fs.readFileSync(new URL('../trip.json',import.meta.url),'utf8'));
const styles=['editorial','storybook','candy','risograph','paper-collage','naive-city','taiwan-poster',
  'field-stamp','quiet-linocut','doodle-memory-grid','crayon-journal','painterly-editorial',
  'geometric-print','quiet-acrylic','vintage-watercolor'];
const artwork=trip.trip?.overviewArtwork?.images || [];

// Template's Tokyo demo has no cover; inject an explicitly scoped test fixture
// instead of changing its genuine published trip or relying on an Osaka-only ID.
async function loadFixture(page,style) {
  if (!artwork.length) {
    await page.route('**/trip.json',async route=>{
      const modified=JSON.parse(JSON.stringify(trip));
      modified.trip.overviewArtwork={subjectIds:[modified.days[0].items[0].id],
        images:[{src:'./assets/storybook/hero.svg',alt:'QA fixture artwork',styleId:style,fit:'contain'}]};
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(modified)});
    });
  }
  await page.goto('/?previewArtwork=1&previewStyle='+encodeURIComponent(style)+'#trip/overview');
  await expect(page.locator('.trip-overview-compact-hero')).toBeVisible();
}

test('all 15 style covers load, remain readable, and do not overflow',async ({page})=>{
  test.setTimeout(180000);
  for(const style of styles){
    for(const width of [390,1100]){
      await page.setViewportSize({width,height:900});
      await loadFixture(page,style);
      const img=page.locator('[data-overview-artwork] img');
      await expect(img,style).toHaveCount(1);
      await expect(img).toBeVisible();
      await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
      const state=await page.evaluate(()=>{
        const art=document.querySelector('[data-overview-artwork]');
        const card=art?.querySelector('.trip-overview-art-frame');
        return {style:document.documentElement.dataset.visualStyle,
          cardHeight:card?.getBoundingClientRect().height||0,
          clip:Math.max(0,document.documentElement.scrollWidth-window.innerWidth),
          dayCount:document.querySelectorAll('.trip-overview-compact-day').length,
          imageSrc:art?.querySelector('img')?.src||''};
      });
      expect(state.style,style).toBe(style);
      expect(state.cardHeight,style+' image height').toBeGreaterThan(70);
      expect(state.cardHeight,style+' image height').toBeLessThanOrEqual(179);
      expect(state.clip,style+' page overflow').toBeLessThanOrEqual(2);
      expect(state.dayCount).toBe(trip.days.length);
      if(artwork.length){
        const selected=artwork.find(x=>x.styleId===style);
        expect(selected).toBeTruthy();
        expect(state.imageSrc).toContain(selected.src.replace('./',''));
      }
    }
  }
});

test('missing art never blocks itinerary navigation',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/assets/overview/**',route=>route.abort('failed'));
  await loadFixture(page,'vintage-watercolor');
  await expect(page.locator('.trip-overview-compact-day')).toHaveCount(trip.days.length);
  await page.locator('.trip-overview-compact-day').first().click();
  await expect(page).toHaveURL(/#trip\/day\//);
});
