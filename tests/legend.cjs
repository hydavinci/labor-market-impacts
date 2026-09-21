const { chromium, launchOptions } = require('./browser.cjs');
const assert = require('node:assert/strict');
const base = process.env.TEST_URL || 'https://market-impact.graymammoth.com/';
const series = ['theoretical', 'observed'];

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.waitForSelector('.ranking-item');
      async function check(expected) {
        for (const name of series) {
          const visible = expected[name];
          const button = page.locator(`[data-series="${name}"]`);
          assert.equal(await button.getAttribute('aria-pressed'), String(visible), `${width}: ${name} pressed`);
          assert.equal(await button.evaluate(el => el.classList.contains('active')), visible);
          assert.equal(await page.locator(`.radar-polygon-${name}`).evaluate(el => el.classList.contains('radar-series-hidden')), !visible);
          assert.equal(await page.locator(`.radar-point-${name}`).count(), visible ? 22 : 0);
          const dots = page.locator(`.dumbbell-dot.${name}:visible`);
          assert.equal(await dots.count(), visible ? 22 : 0);
          const color = name === 'theoretical' ? 'blue' : 'coral';
          assert.equal(await page.locator(`.dumbbell-value.${color}:visible`).count(), visible ? 22 : 0);
        }
        assert.equal(await page.locator('.dumbbell-link:visible').count(), expected.theoretical && expected.observed ? 22 : 0);
        assert.equal(await page.locator('.radar-label-button').count(), 22);
      }
      for (const lang of ['zh', 'en']) {
        await page.locator(`[data-lang="${lang}"]`).click();
        // A cycle covers both directions of all eight single-button transitions.
        let expected = { theoretical: true, observed: true };
        await check(expected);
        const cycle = ['theoretical', 'observed', 'theoretical', 'observed', 'observed', 'theoretical', 'observed', 'theoretical'];
        for (const input of ['click', 'Enter', 'Space']) {
          for (const name of cycle) {
            const button = page.locator(`[data-series="${name}"]`);
            if (input === 'click') await button.click();
            else { await button.focus(); await page.keyboard.press(input); }
            expected[name] = !expected[name];
            await check(expected);
          }
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS independent legend toggles: all four states/eight transitions, click/Enter/Space, Chinese/English, desktop/mobile, polygons/points/dumbbells synchronized');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
