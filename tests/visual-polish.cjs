const { chromium, launchOptions } = require('./browser.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.TEST_URL || 'https://market-impact.graymammoth.com/';
const widths = [1440, 1024, 768, 390, 320];
const langs = ['zh', 'en'];
const out = path.resolve(__dirname, '../artifacts');

function visibleBoxWithinViewport(box, width, label) {
  assert(box.width > 0 && box.height > 0, `${label} has no visible size`);
  assert(box.left >= -1, `${label} left overflow: ${JSON.stringify(box)}`);
  assert(box.right <= width + 1, `${label} right overflow: ${JSON.stringify(box)}`);
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    const response = await page.goto(base, { waitUntil: 'networkidle' });
    assert(response && response.ok(), `navigation failed: ${response && response.status()}`);
    await page.waitForSelector('.ranking-item');

    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true, 'reduced-motion media query not applied');
    assert.equal(await page.locator('#categoryPicker, .category-picker, select').count(), 0, 'legacy/dropdown category picker should be absent');
    assert.equal(await page.locator('.radar-panel .panel-heading .legend-toggle').count(), 2, 'legend controls belong in radar header');
    assert.equal(await page.locator('.controls-panel .legend, .panel-heading [data-i18n="radarTitle"]').count(), 0, 'old legend placement and visible title removed');

    for (const lang of langs) {
      await page.locator(`[data-lang="${lang}"]`).click();
      await page.waitForFunction(expected => document.documentElement.lang === expected, lang === 'zh' ? 'zh-Hans' : 'en');

      for (const width of widths) {
        await page.setViewportSize({ width, height: 1100 });
        await page.waitForTimeout(50);

        const sizes = await page.evaluate(() => ({
          htmlScroll: document.documentElement.scrollWidth,
          htmlClient: document.documentElement.clientWidth,
          bodyScroll: document.body.scrollWidth,
          inner: window.innerWidth,
          motion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          heroFont: parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize),
          rankingColumns: getComputedStyle(document.querySelector('.ranking-list')).gridTemplateColumns.split(' ').length,
          radarTop: document.querySelector('.radar-panel').getBoundingClientRect().top + scrollY
        }));
        assert(sizes.htmlScroll <= sizes.inner + 1, `${lang}/${width} html horizontal overflow: ${JSON.stringify(sizes)}`);
        assert(sizes.bodyScroll <= sizes.inner + 1, `${lang}/${width} body horizontal overflow: ${JSON.stringify(sizes)}`);
        assert(sizes.heroFont <= 28, `${lang}/${width} hero font too large: ${sizes.heroFont}px`);
        assert.equal(sizes.motion, true, `${lang}/${width} reduced motion not respected by browser context`);
        assert.equal(sizes.rankingColumns, 1, `${lang}/${width} compact ranking columns`);
        if (width === 1440) assert(sizes.radarTop < 400, `${lang}/${width} excessive whitespace above radar: ${sizes.radarTop}`);

        assert.equal(await page.locator('#methodGrid, #methodText, .caveat-card').count(), 0, 'method and boundary cards removed');
        const surfaces = await page.locator('.radar-panel,.detail-card,.heat-card,.ranking-section').evaluateAll(nodes => nodes.map(n => {
          const s = getComputedStyle(n);
          return {background:s.backgroundColor, borders:['Top','Right','Bottom','Left'].map(side => `${s[`border${side}Width`]} ${s[`border${side}Style`]} ${s[`border${side}Color`]}`)};
        }));
        for (const surface of surfaces) {
          assert.equal(surface.background, 'rgb(255, 255, 255)');
          assert.deepEqual(surface.borders, Array(4).fill('1px solid rgb(229, 229, 234)'));
        }
        if (width <= 560) {
          const heights = await page.locator('.button,.lang-button,.sort-button,.legend-toggle,.search-input').evaluateAll(nodes => nodes.map(n=>n.getBoundingClientRect().height));
          assert(heights.every(h=>h>=44), `${lang}/${width} touch controls must be >=44px`);
          assert(await page.locator('.search-input').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=16), 'Avoid Safari focus zoom');
        }


        const controls = await page.locator('button, input, a.button, .source-mini, .ranking-item, .legend-toggle').evaluateAll(nodes => nodes
          .filter(node => {
            const style = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
          })
          .map((node, i) => {
            const box = node.getBoundingClientRect();
            return { i, label: node.id || node.dataset.lang || node.dataset.sort || node.dataset.series || node.dataset.id || node.className || node.tagName, left: box.left, right: box.right, width: box.width, height: box.height };
          }));
        for (const box of controls) visibleBoxWithinViewport(box, width, `${lang}/${width} control ${box.label}`);

        await page.locator('.radar-label-button[data-id="office-admin"]').click();
        assert.equal(await page.locator('#detailTitle').innerText(), lang === 'zh' ? '办公室与行政' : 'Office & admin', `${lang}/${width} radar selection failed`);

        await page.locator('.ranking-item[data-id="computer-math"]').click();
        assert.equal(await page.locator('#detailTitle').innerText(), lang === 'zh' ? '计算机与数学' : 'Computer & math', `${lang}/${width} ranking selection failed`);
        assert(await page.locator('.ranking-item[data-id="computer-math"]').evaluate(el => el.classList.contains('selected')), `${lang}/${width} ranking selected state missing`);

        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
        await page.screenshot({ path: path.join(out, `polish-${lang}-${width}.png`), fullPage: true });
      }
    }

    const moving = await page.locator('*').evaluateAll(nodes => nodes.filter(node => {
      const style = getComputedStyle(node);
      const exceedsReducedDuration = value => value.split(',').some(part => parseFloat(part) * (part.trim().endsWith('ms') ? 1 : 1000) > 0.0011);
      return (style.animationName !== 'none' && exceedsReducedDuration(style.animationDuration)) || exceedsReducedDuration(style.transitionDuration);
    }).map(node => ({ tag: node.tagName, cls: node.className, animationName: getComputedStyle(node).animationName, transitionDuration: getComputedStyle(node).transitionDuration })));
    assert.deepEqual(moving, [], `reduced-motion should disable active CSS animation/transition: ${JSON.stringify(moving)}`);

    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS visual polish regression: zh/en at 1440/1024/768/390/320, no horizontal overflow, controls in viewport, radar/list selection, no dropdown, hero <=28px, reduced motion, screenshots in artifacts/polish-{lang}-{width}.png');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
