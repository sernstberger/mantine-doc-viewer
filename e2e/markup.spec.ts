// Marking up a page without a pointer: the keyboard path to placing a mark. Markup is opened with
// focus() and Enter because WebKit does not focus a button on click
import type { Page } from '@playwright/test';
import { openPdf } from './support/doc';
import { expect, test } from './support/story';

const FOLIO = 'docviewer-apps-folio-desktop-document-app--folio';

const layer = (page: Page, tool: string, pageNumber: number) =>
  page.getByRole('application', { name: `${tool} on page ${pageNumber}` });

async function pickHighlight(page: Page) {
  await openPdf(page, FOLIO);
  await page.getByRole('button', { name: 'Markup' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Highlight' }).click();
  await expect(page.getByRole('button', { name: 'Highlight' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
}

test('arrows and Enter place a highlight on the focused page', async ({ page }) => {
  await pickHighlight(page);
  const first = layer(page, 'Highlight', 1);
  await first.focus();
  await expect(first).toBeFocused();
  await expect(first.locator('[data-markup-caret]')).toBeAttached();
  await expect(first.locator('[data-mark]')).toHaveCount(0);

  // Enter starts the mark at the cursor, arrows stretch it, Enter finishes it
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Highlight started' })).toBeAttached();
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(first.locator('[data-mark="highlight"]')).toHaveCount(1);
  await expect(page.getByRole('status').filter({ hasText: 'Highlight added' })).toBeAttached();
  // Focus stays on the page, ready for the next mark
  await expect(first).toBeFocused();
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();

  // The mark has real size on screen
  const box = (await first.locator('[data-mark="highlight"]').boundingBox())!;
  expect(box.width).toBeGreaterThan(20);
  expect(box.height).toBeGreaterThan(5);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(first.locator('[data-mark]')).toHaveCount(0);
});

test('Escape drops the mark being drawn', async ({ page }) => {
  await pickHighlight(page);
  const first = layer(page, 'Highlight', 1);
  await first.focus();

  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByRole('status').filter({ hasText: 'Highlight started' })).toBeAttached();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('status').filter({ hasText: 'Mark cancelled' })).toBeAttached();
  await expect(first.locator('[data-mark]')).toHaveCount(0);
  await expect(first).toBeFocused();
});
