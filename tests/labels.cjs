const { chromium, launchOptions } = require('./browser.cjs');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch(launchOptions);
 try {
  const page = await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL || 'https://market-impact.graymammoth.com/',{waitUntil:'networkidle'});
  for(const lang of ['zh','en']) {
   await page.locator(`[data-lang="${lang}"]`).click();
   for(const width of [1440,1024,768,390,320]) {
    await page.setViewportSize({width,height:1100});
    const labels=await page.locator('.radar-label-button').evaluateAll(nodes=>nodes.map(node=>{
     const rect=node.querySelector('rect').getBBox();
     const text=node.querySelector('.radar-short-label');
     const box=text.getBBox();
     return {title:node.querySelector('title').textContent,lines:[...text.querySelectorAll('tspan')].map(t=>t.textContent),rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},box:{x:box.x,y:box.y,width:box.width,height:box.height},hidden:parseFloat(getComputedStyle(text).fontSize)===0};
    }));
    assert.equal(labels.length,22);
    for(const label of labels) {
     assert.equal(label.lines.join('').replace(/\s/g,''),label.title.replace(/^\d+\. /,'').replace(/\s/g,''));
     if(!label.hidden) {
      assert(label.box.x>=label.rect.x && label.box.x+label.box.width<=label.rect.x+label.rect.width,`text width: ${label.title}`);
      assert(label.box.y>=label.rect.y && label.box.y+label.box.height<=label.rect.y+label.rect.height,`text height: ${label.title}`);
     }
     assert(label.rect.x>=0 && label.rect.x+label.rect.width<=760);
     assert(label.rect.y>=0 && label.rect.y+label.rect.height<=760);
    }
    for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++) {
     const a=labels[i].rect,b=labels[j].rect;
     assert(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y,`overlap ${i}/${j}`);
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(width===1440) await page.locator('#radarChart').screenshot({path:`artifacts/full-labels-${lang}.png`});
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS all 22 full bilingual labels preserved, text fits cards, no overlapping cards or SVG clipping, responsive widths 1440/1024/768/390/320');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
