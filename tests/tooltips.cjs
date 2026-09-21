const { chromium, launchOptions } = require('./browser.cjs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.TEST_URL || 'https://market-impact.graymammoth.com/', { waitUntil: 'networkidle' });
    for (const lang of ['zh', 'en']) {
      await page.locator(`[data-lang="${lang}"]`).click();
      assert.equal(await page.locator('.radar-label-button > title').count(), 22);
      assert.equal(await page.locator('.radar-point-button > title').count(), 44);
      const office = page.locator('.radar-label-button[data-id="office-admin"]');
      const name = lang === 'zh' ? '办公室与行政' : 'Office & admin';
      assert.equal(await office.locator('title').textContent(), `17. ${name}`);
      await office.hover();
      await office.click();
      assert.equal(await page.locator('#detailTitle').innerText(), name);
      assert.equal(await office.locator('title').textContent(), `17. ${name}`);
      for (const [series, value] of [['theoretical', '90%'], ['observed', '≈34%']]) {
        const point = page.locator(`.radar-point-button[data-id="office-admin"]`).filter({ has: page.locator(`.radar-point-${series}`) });
        const title = await point.locator('title').textContent();
        assert(title.includes(name));
        assert(title.includes(value));
        const legend = await page.locator(`[data-series="${series}"]`).innerText();
        assert(title.includes(legend.trim()));
        assert((await point.getAttribute('aria-label')).includes(title));
      }
      await page.locator('[data-series="theoretical"]').click();
      assert.equal(await page.locator('.radar-label-button > title').count(), 22);
      assert.equal(await page.locator('.radar-point-button > title').count(), 22);
      await page.locator('[data-series="theoretical"]').click();
      // Every native SVG hover target resolves to its own title before the chart title.
      assert(await page.locator('.radar-label-bg, .radar-label-text, .radar-short-label, .radar-point-button circle').evaluateAll(nodes => nodes.every(node => node.parentElement.querySelector(':scope > title')?.textContent)));
    }
    assert.deepEqual(errors, []);
    console.log('PASS bilingual occupational tooltips, metric/value point titles, accessible names and title retention after selection/series rerender');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
