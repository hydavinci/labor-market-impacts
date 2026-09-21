const { chromium, launchOptions } = require('./browser.cjs');
const assert = require('node:assert/strict');
const data = require('../data.json');
(async () => {
 const browser = await chromium.launch(launchOptions);
 try {
  const page = await browser.newPage();
  await page.goto(process.env.TEST_URL || 'https://market-impact.graymammoth.com/', {waitUntil:'networkidle'});
  for (const lang of ['zh', 'en']) {
   await page.locator(`[data-lang="${lang}"]`).click();
   for (const width of [1440,1024,768,390,320]) {
    await page.setViewportSize({width,height:1100});
    assert.equal(await page.locator('.rank-bars').count(),0);
    assert.equal(await page.locator('.dumbbell-scale:visible').count(),1);
    const rows=await page.locator('.ranking-item').evaluateAll(nodes=>nodes.map(node=>{
     const box=node.querySelector('.dumbbell-plot').getBoundingClientRect();
     const t=node.querySelector('.theoretical'),o=node.querySelector('.observed'),link=node.querySelector('.dumbbell-link');
     const values=[...node.querySelectorAll('.dumbbell-value')].map(n=>n.getBoundingClientRect());
     return {id:node.dataset.id,theory:parseFloat(t.style.left),observed:parseFloat(o.style.left),start:parseFloat(link.style.left),gap:parseFloat(link.style.width),width:box.width,tCenter:t.getBoundingClientRect().x+t.getBoundingClientRect().width/2-box.x,oCenter:o.getBoundingClientRect().x+o.getBoundingClientRect().width/2-box.x,labelsFit:values[0].right<=values[1].left,titleT:t.title,titleO:o.title};
    }));
    assert.equal(rows.length,22);
    for(const row of rows){
     const category=data.categories.find(c=>c.id===row.id);
     assert.equal(row.theory,category.theoretical);assert.equal(row.observed,category.observed);
     assert.equal(row.start,Math.min(row.theory,row.observed));assert.equal(row.gap,Math.abs(row.theory-row.observed));
     assert(Math.abs(row.tCenter-row.width*row.theory/100)<1);
     assert(Math.abs(row.oCenter-row.width*row.observed/100)<1);
     assert(row.labelsFit);assert(row.titleT.includes('%')&&row.titleO.includes('%'));
    }
    await page.locator('.ranking-section').screenshot({path:`artifacts/dumbbell-${lang}-${width}.png`});
   }
  }
  console.log('PASS bilingual dumbbell positions/links match all 22 data values, responsive shared scales, no label overlap, titles and screenshots');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
