// Test-only dependency; the application itself has no npm dependencies.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const launchOptions = {headless:true, args:['--no-sandbox']};
if (process.env.CHROMIUM_EXECUTABLE) launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE;
module.exports = {chromium, launchOptions};
