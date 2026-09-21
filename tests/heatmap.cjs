const {chromium,launchOptions}=require('./browser.cjs');
const assert=require('node:assert/strict');
const data=require('../data.json');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 try {
  const page=await browser.newPage({reducedMotion:'reduce'}); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL||'https://market-impact.graymammoth.com/',{waitUntil:'networkidle'});
  for(const lang of ['zh','en']) {
   await page.locator(`[data-lang="${lang}"]`).click();
   for(const width of [1440,1024,768,390,320]) {
    await page.setViewportSize({width,height:1100});
    assert.equal(await page.locator('#scatterChart').count(),0);
    for(const category of data.categories) {
     await page.locator(`.ranking-item[data-id="${category.id}"]`).click();
     assert.equal(await page.locator('#heatChart').getAttribute('data-id'),category.id);
     assert.equal(await page.locator('#heatSelected').textContent(),await page.locator('#detailTitle').textContent());
     assert.equal(await page.locator('#heatChart .heat-cell').count(),100);
     for(const series of ['theoretical','observed']) {
      const fills=await page.locator(`#heatChart .heat-fill.${series}`).evaluateAll(ns=>ns.map(n=>parseFloat(n.style.width)));
      assert.equal(fills.length,100);
      fills.forEach((fill,i)=>assert(Math.abs(fill-Math.max(0,Math.min(1,category[series]-i))*100)<1e-8));
      assert(Math.abs(fills.reduce((sum,n)=>sum+n/100,0)-category[series])<1e-8);
      assert((await page.locator(`.heat-value.${series} strong`).textContent()).includes('%'));
      const colorMatches=await page.locator(`.heat-fill.${series}`).first().evaluate((node,series)=>['backgroundColor','backgroundImage'].every(key=>getComputedStyle(node)[key] === getComputedStyle(document.querySelector(`.heat-value.${series} .heat-swatch`))[key]),series);
      assert(colorMatches);
     }
     assert((await page.locator('#heatChart').getAttribute('aria-label')).includes(await page.locator('#detailTitle').textContent()));
    }
    const label=page.locator('.radar-label-button[data-id="computer-math"]');
    await label.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#heatChart').getAttribute('data-id'),'computer-math');
    assert(await label.evaluate(n=>n===document.activeElement));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const geometry=await page.locator('#heatChart').evaluate(n=>{
     const box=n.getBoundingClientRect(); const cells=[...n.children].map(c=>c.getBoundingClientRect());
     const first=n.querySelector('.heat-cell'),base=first.querySelector('.theoretical'),inner=first.querySelector('.observed');
     return {square:Math.abs(box.width-box.height)<1, cellSquare:cells.every(c=>Math.abs(c.width-c.height)<1),cols:new Set(cells.map(c=>Math.round(c.x))).size,rows:new Set(cells.map(c=>Math.round(c.y))).size,equalLayers:inner.getBoundingClientRect().width===base.getBoundingClientRect().width && inner.getBoundingClientRect().height===base.getBoundingClientRect().height && inner.getBoundingClientRect().x===base.getBoundingClientRect().x && inner.getBoundingClientRect().y===base.getBoundingClientRect().y,blend:getComputedStyle(inner).mixBlendMode,isolation:getComputedStyle(first).isolation};
    });
    assert.deepEqual(geometry,{square:true,cellSquare:true,cols:10,rows:10,equalLayers:true,blend:'normal',isolation:'isolate'});
    for (const series of ['theoretical','observed']) {
     const glass=await page.locator(`.heat-fill.${series}`).first().evaluate(n=>({image:getComputedStyle(n).backgroundImage,shadow:getComputedStyle(n).boxShadow}));
     assert.match(glass.image,/^linear-gradient/);
     assert.match(glass.image,/rgba/);
     assert.match(glass.shadow,/inset/);
    }
    await page.locator('.heat-card').screenshot({path:`artifacts/heatmap-${lang}-${width}.png`});
   }
   const toggle=s=>page.locator(`.legend-toggle[data-series="${s}"]`);
   await toggle('theoretical').click();
   assert.equal(await page.locator('.heat-fill.theoretical').count(),0);assert.equal(await page.locator('.heat-fill.observed').count(),100);assert(!(await page.locator('#heatGap').isVisible()));
   await toggle('observed').click();assert.equal(await page.locator('.heat-fill').count(),0);assert(await page.locator('#heatUnavailable').isVisible());assert.equal(await page.locator('.heat-value').count(),0);
   await toggle('theoretical').click();assert.equal(await page.locator('.heat-fill.theoretical').count(),100);assert.equal(await page.locator('.heat-fill.observed').count(),0);
   await toggle('observed').click();assert.equal(await page.locator('.heat-fill').count(),200);assert(await page.locator('#heatGap').isVisible());
  }
  assert.deepEqual(errors,[]);console.log('PASS heatmap: one square 10x10 grid, exact independent fills for all 22 occupations, bilingual/five widths, linked selection, keyboard, all legend states, no overflow/errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
