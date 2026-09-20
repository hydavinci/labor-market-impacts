// Public-browser smoke test. Requires cached Playwright; no npm install needed.
const {chromium, launchOptions} = require('./browser.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'https://market-impact.graymammoth.com/';
(async () => {
  const browser = await chromium.launch(launchOptions);
  const out=path.resolve(__dirname,'../artifacts');fs.mkdirSync(out,{recursive:true});
  const reports=[];
  try {
    for(const viewport of [{width:1440,height:1100},{width:390,height:844},{width:320,height:740}]) {
      const page=await browser.newPage({viewport});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(base,{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      await page.waitForFunction(()=>document.querySelectorAll('svg').length>0 && document.body.innerText.includes('94'));
      assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hans');
      const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert(sizes.scroll<=sizes.client+1,`overflow at ${viewport.width}: ${JSON.stringify(sizes)}`);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(out,`zh-${viewport.width}.png`),fullPage:true});
      reports.push({viewport,errors,overflow:false,title:await page.title()});
      await page.close();
    }
    fs.writeFileSync(path.join(out,'smoke-report.json'),JSON.stringify(reports,null,2));
    console.log('PASS',JSON.stringify(reports,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
