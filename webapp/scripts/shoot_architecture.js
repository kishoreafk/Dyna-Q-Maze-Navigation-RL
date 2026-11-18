/* Screenshot the architecture diagram HTML to PNG for the report. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1240, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto("file:///home/z/my-project/scripts/architecture.html");
  await page.waitForTimeout(400);
  const body = await page.locator("body");
  await body.screenshot({ path: "/home/z/my-project/data/cavr/figures_report/fig_architecture.png" });
  await browser.close();
  console.log("architecture figure saved");
})();
