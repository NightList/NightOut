// Run with TEST_BASE_URL and, if Playwright is not local, PLAYWRIGHT_MODULE_PATH.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const baseURL = process.env.TEST_BASE_URL;
assert.ok(baseURL, 'Set TEST_BASE_URL to the running demo frontend');
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href
    : 'playwright'
);
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto(new URL('/login', baseURL).href);
      await page.getByRole('button', { name: 'ลูกค้า', exact: true }).click();
      await page.getByRole('button', { name: 'โปรไฟล์', exact: true }).waitFor();
      // Deliberately unsorted; another user's newer notification must stay hidden.
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('nightout-demo-v1'));
        const userId = state.notifications[0].userId;
        state.notifications = [1, 4, 2, 3].map((day) => ({
          id: `check-${day}`,
          userId,
          title: `Check ${day}`,
          body: 'Dropdown check',
          createdAt: `2026-01-0${day}T00:00:00Z`,
        }));
        state.notifications.push({
          id: 'other',
          userId: 'other-user',
          title: 'Private',
          body: '',
          createdAt: '2027-01-01T00:00:00Z',
        });
        localStorage.setItem('nightout-demo-v1', JSON.stringify(state));
      });
      await page.reload();
      await page.getByRole('button', { name: /^แจ้งเตือน/ }).click();
      const preview = page.getByRole('dialog', { name: 'แจ้งเตือนล่าสุด' });
      await preview.waitFor();
      assert.deepEqual(await preview.locator('li p.font-semibold').allTextContents(), [
        'Check 4',
        'Check 3',
        'Check 2',
      ]);
      const bounds = await preview.boundingBox();
      assert.ok(
        bounds && bounds.x >= 0 && bounds.x + bounds.width <= width,
        'Preview fits viewport',
      );
      await preview.getByRole('link', { name: 'ดูรายการทั้งหมด' }).click();
      await page.waitForURL('**/notifications');
      await page.getByRole('button', { name: 'โปรไฟล์', exact: true }).click();
      await page.getByRole('menuitem', { name: 'ดูโปรไฟล์' }).click();
      await page.waitForURL('**/profile');
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('nightout-demo-v1'));
        state.notifications = [];
        localStorage.setItem('nightout-demo-v1', JSON.stringify(state));
      });
      await page.reload();
      await page.getByRole('button', { name: /^แจ้งเตือน/ }).click();
      await preview.getByText('ยังไม่มีแจ้งเตือน').waitFor();
      await page.getByRole('button', { name: /^แจ้งเตือน/ }).click();
      await page.getByRole('button', { name: 'โปรไฟล์', exact: true }).click();
      await page.getByRole('menuitem', { name: 'ออกจากระบบ' }).click();
      await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'โปรไฟล์', exact: true }).count(), 0);
      console.log(`Navbar checks passed (${width}px)`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
