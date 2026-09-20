const {chromium, launchOptions}=require('./browser.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch(launchOptions);try{
const p=await browser.newPage({viewport:{width:1440,height:1100}});
await p.goto(process.env.TEST_URL || 'https://market-impact.graymammoth.com/',{waitUntil:'networkidle'});
const target=p.locator('.radar-label-button[data-id="transportation"]');await target.focus();await p.keyboard.press('Enter');
assert.equal(await p.evaluate(()=>document.activeElement.dataset.id),'transportation');
const css=await p.locator('.radar-label-button.selected').evaluate(el=>{const s=getComputedStyle(el),r=getComputedStyle(el.querySelector('rect'));return {outline:s.outlineStyle,shadow:s.boxShadow,stroke:r.strokeWidth,effect:r.vectorEffect}});
assert.deepEqual(css,{outline:'none',shadow:'none',stroke:'1px',effect:'non-scaling-stroke'});
assert(await p.locator('.hero h1').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)<=28));
assert.equal(await p.locator('html').evaluate(e=>getComputedStyle(e).fontSize),'14px');
await p.locator('.radar-chart').screenshot({path:'artifacts/radar-thin-selection.png'});
for(const lang of ['en','zh']){await p.locator(`[data-lang="${lang}"]`).click();for(const width of [1440,390,320]){await p.setViewportSize({width,height:1100});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
console.log('PASS 1px single SVG selection, no native outline/halo, retained keyboard focus, smaller typography and bilingual responsive widths');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
