// Focus and keyboard behaviour that jsdom cannot prove: roving focus in a real toolbar, focus after a bar
// closes, tooltips inside the viewer, and the presentation buttons. Buttons are focused with focus() and
// pressed with Enter because WebKit does not focus a button on click
import { openPdf, pageIndicator } from './support/doc';
import { expect, test } from './support/story';

const USAGE = 'docviewer--usage';
const FOLIO = 'apps-folio--folio';

test('arrow keys still move focus from a toolbar button that has become unavailable', async ({
  page,
}) => {
  await openPdf(page, USAGE);
  const next = page.getByRole('button', { name: 'Next page' });
  await next.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(pageIndicator(page)).toHaveText('Page 3 of 3');
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(next).not.toBeFocused();
  const inToolbar = await page.evaluate(
    () => !!document.activeElement?.closest('[role="toolbar"]')
  );
  expect(inToolbar).toBe(true);
});

test('closing the markup bar puts focus back on the Markup button', async ({ page }) => {
  await openPdf(page, FOLIO);
  const markup = page.getByRole('button', { name: 'Markup' });
  await markup.focus();
  await page.keyboard.press('Enter');
  const close = page.getByRole('button', { name: 'Close markup' });
  await expect(close).toBeVisible();

  await close.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('toolbar', { name: 'Markup' })).toHaveCount(0);
  await expect(markup).toBeFocused();
});

test('a toolbar tooltip is a child of the viewer, so it also shows in full screen', async ({
  page,
}) => {
  await openPdf(page, USAGE);
  await page.getByRole('button', { name: 'Zoom in' }).focus();
  const tooltip = page.getByRole('tooltip').filter({ hasText: 'Zoom in' });
  await expect(tooltip).toBeVisible();
  const inViewer = await tooltip.evaluate((node) => !!node.closest('.mantine-DocViewer-root'));
  expect(inViewer).toBe(true);
});

test('a presentation can go back with its own previous page button', async ({ page }) => {
  await openPdf(page, USAGE);
  await page.getByRole('button', { name: 'Presentation' }).first().click();
  const controls = page.locator('.mantine-DocViewer-presentationControls');
  await expect(controls).toBeVisible();
  await expect(controls).toContainText('1 / 3');

  await controls.getByRole('button', { name: 'Next page' }).click();
  await expect(controls).toContainText('2 / 3');
  await controls.getByRole('button', { name: 'Previous page' }).click();
  await expect(controls).toContainText('1 / 3');
});

test('the unavailable presentation button is dimmed on a transparent background', async ({
  page,
}) => {
  await openPdf(page, USAGE);
  await page.getByRole('button', { name: 'Presentation' }).first().click();
  const controls = page.locator('.mantine-DocViewer-presentationControls');
  const previous = controls.getByRole('button', { name: 'Previous page' });
  await expect(previous).toHaveAttribute('data-disabled', 'true');
  const style = await previous.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { background: computed.backgroundColor, opacity: computed.opacity };
  });
  expect(style).toEqual({ background: 'rgba(0, 0, 0, 0)', opacity: '0.4' });
});

test('the zoom menu checks the current zoom', async ({ page }) => {
  await openPdf(page, USAGE);
  await page.getByRole('button', { name: /^Zoom \d+%$/ }).click();
  await expect(page.getByRole('menuitemradio', { checked: true })).toHaveCount(1);
});
