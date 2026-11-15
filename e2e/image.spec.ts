// The image view in a real layout: zoom and drag-to-pan need scroll sizes jsdom does not have
import type { Page } from '@playwright/test';
import { zoomLevel } from './support/doc';
import { expect, openStory, test } from './support/story';

const stage = (page: Page) => page.getByRole('region', { name: 'sample-image.svg' });
const fit = (page: Page) => page.getByRole('button', { name: 'Fit to view' });

async function openImage(page: Page) {
  await openStory(page, 'docviewer--image');
  await expect(page.getByRole('img', { name: 'sample-image.svg' })).toBeVisible();
  await expect(fit(page)).toHaveAttribute('aria-pressed', 'true');
}

const percent = async (page: Page) =>
  Number.parseInt((await zoomLevel(page).innerText()).replace('%', ''), 10);

/** Zooms until the image is larger than the view, so that it can be dragged */
async function zoomUntilPannable(page: Page) {
  await zoomLevel(page).click();
  await expect(zoomLevel(page)).toHaveText('100%');
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });

  for (let step = 0; step < 4; step++) {
    await zoomIn.click();
  }

  await expect(stage(page)).toHaveAttribute('data-pannable', 'true');
}

test('zoom in, out, reset and fit', async ({ page }) => {
  await openImage(page);
  const fitted = await percent(page);
  expect(fitted).toBeLessThan(100);

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => percent(page)).toBeGreaterThan(fitted);
  await expect(fit(page)).toHaveAttribute('aria-pressed', 'false');

  await zoomLevel(page).click();
  await expect(zoomLevel(page)).toHaveText('100%');

  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect.poll(() => percent(page)).toBeLessThan(100);

  await fit(page).click();
  await expect(zoomLevel(page)).toHaveText(`${fitted}%`);
  await expect(fit(page)).toHaveAttribute('aria-pressed', 'true');
});

test('dragging pans an image larger than the view', async ({ page }) => {
  await openImage(page);
  const view = stage(page);

  // Nothing to pan while the image fits
  await expect(view).not.toHaveAttribute('data-pannable', 'true');

  await zoomUntilPannable(page);
  const position = () => view.evaluate((element) => [element.scrollLeft, element.scrollTop]);
  // Start from the middle, so there is room to scroll both ways
  await view.evaluate((element) => {
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  });
  const [left, top] = await position();

  const box = (await view.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect(view).toHaveAttribute('data-panning', 'true');
  await page.mouse.move(start.x - 60, start.y - 40, { steps: 6 });
  await page.mouse.up();
  await expect(view).not.toHaveAttribute('data-panning', 'true');

  // Dragging the picture left and up shows what is to the right and below
  const [movedLeft, movedTop] = await position();
  expect(movedLeft).toBeGreaterThan(left + 30);
  expect(movedTop).toBeGreaterThan(top + 20);
});

test('the keyboard zooms the image', async ({ page }) => {
  await openImage(page);
  const view = stage(page);
  const fitted = await percent(page);
  await view.focus();

  await page.keyboard.press('=');
  await expect.poll(() => percent(page)).toBeGreaterThan(fitted);
  await expect(fit(page)).toHaveAttribute('aria-pressed', 'false');

  const zoomed = await percent(page);
  await page.keyboard.press('-');
  await expect.poll(() => percent(page)).toBeLessThan(zoomed);

  await page.keyboard.press('=');
  await page.keyboard.press('=');
  await page.keyboard.press('0');
  await expect(zoomLevel(page)).toHaveText(`${fitted}%`);
  await expect(fit(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(view).toBeFocused();
});
