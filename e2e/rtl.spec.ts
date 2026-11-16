// Right-to-left scroll positions: browsers count scrollLeft from 0 down to negative numbers there
import type { Locator, Page } from '@playwright/test';
import {
  firstLoad,
  pageIndicator,
  pdfPage,
  resetZoom,
  visibleShare,
  zoomLevel,
} from './support/doc';
import { expect, openStory, test } from './support/story';

/** Opens a story and flips the Storybook direction global to rtl with the preview's Alt+Shift+R shortcut */
async function openRtl(page: Page, id: string) {
  await openStory(page, id);
  await page.keyboard.press('Alt+Shift+R');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
}

const scrollLeft = (locator: Locator) => locator.evaluate((element) => element.scrollLeft);

test('zooming keeps the page in view in a right-to-left viewer with a horizontal scrollbar', async ({
  page,
}) => {
  await openRtl(page, 'docviewer--usage');
  await expect(pageIndicator(page)).toHaveText(/^Page 1 of \d+$/, firstLoad);
  await expect(pdfPage(page, 1).locator('canvas')).toBeVisible(firstLoad);
  await resetZoom(page);
  await expect(zoomLevel(page)).toHaveText('100%');

  const scroller = page.getByRole('region').filter({ has: pdfPage(page, 1) });
  for (let step = 0; step < 4; step++) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
  }
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await expect(pageIndicator(page)).toHaveText(/^Page 1 of \d+$/);

  const direction = await scroller.evaluate((element) => getComputedStyle(element).direction);
  expect(direction).toBe('rtl');
  expect(await scrollLeft(scroller)).toBeLessThanOrEqual(0);
  expect(await visibleShare(pdfPage(page, 1))).toBeGreaterThan(0.5);

  const horizontalShare = () =>
    pdfPage(page, 1).evaluate((element) => {
      const view = element.closest('[role="region"]')!.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return Math.max(0, Math.min(box.right, view.right) - Math.max(box.left, view.left));
    });
  expect(await horizontalShare()).toBeGreaterThan(100);

  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect(pageIndicator(page)).toHaveText(/^Page 1 of \d+$/);
  expect(await horizontalShare()).toBeGreaterThan(100);
});

test('dragging a zoomed image pans it in a right-to-left viewer', async ({ page }) => {
  await openRtl(page, 'docviewer--image');
  const stage = page.getByRole('region', { name: 'sample-image.svg' });
  await expect(stage).toBeVisible(firstLoad);
  await resetZoom(page);
  for (let step = 0; step < 4; step++) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
  }
  await expect(stage).toHaveAttribute('data-pannable', 'true');

  const before = await scrollLeft(stage);
  expect(before).toBeLessThanOrEqual(0);
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, y, { steps: 6 });
  await page.mouse.up();

  expect(await scrollLeft(stage)).toBeLessThan(before);
});

test('the active thumbnail of a horizontal rail stays in view in a right-to-left viewer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 300, height: 700 });
  await openRtl(page, 'docviewer--with-thumbnails-bottom');
  await expect(pageIndicator(page)).toHaveText(/^Page 1 of \d+$/, firstLoad);
  const rail = page.getByRole('listbox', { name: 'Pages' });
  await expect(rail.getByRole('option')).toHaveCount(3);
  expect(await rail.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await rail.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');

  for (const number of [3, 1, 3]) {
    await rail.getByRole('option', { name: `Page ${number}` }).click();
    await expect(pageIndicator(page)).toHaveText(new RegExp(`^Page ${number} of`));
    await expect
      .poll(() =>
        rail.evaluate((element, label) => {
          const option = element.querySelector(`[aria-label="${label}"]`)!;
          const view = element.getBoundingClientRect();
          const box = option.getBoundingClientRect();
          return box.left >= view.left - 1 && box.right <= view.right + 1;
        }, `Page ${number}`)
      )
      .toBe(true);
  }
});
