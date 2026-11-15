// Reading a PDF in a real layout: scroll positions, zoom anchoring and highlights that jsdom cannot see
import type { Page } from '@playwright/test';
import {
  openPdf,
  pageIndicator,
  pdfPage,
  pdfPages,
  visibleShare,
  resetZoom,
  zoomLevel,
} from './support/doc';
import { expect, scrollMetrics, scrollTo, test } from './support/story';

const percent = async (page: Page) =>
  Number.parseInt((await zoomLevel(page).innerText()).replace('%', ''), 10);

/** True while at least half of the page is in the scrolling view */
const reading = (page: Page, number: number) => async () =>
  (await visibleShare(pdfPage(page, number))) > 0.5;

test.describe('page indicator and navigation', () => {
  test('scrolling updates the page indicator', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    const pages = pdfPages(page);
    expect((await scrollMetrics(pages)).scrollHeight).toBeGreaterThan(
      (await scrollMetrics(pages)).clientHeight
    );

    await scrollTo(pages, 'bottom');
    await expect(pageIndicator(page)).toHaveText('Page 3 of 3');

    await scrollTo(pages, 0);
    await expect(pageIndicator(page)).toHaveText('Page 1 of 3');
  });

  test('Next and Previous page buttons move through the document', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    const next = page.getByRole('button', { name: 'Next page' });
    const previous = page.getByRole('button', { name: 'Previous page' });
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);
    await expect(previous).toBeEnabled();

    await next.click();
    await expect(pageIndicator(page)).toHaveText('Page 3 of 3');
    await expect(next).toBeDisabled();

    await previous.click();
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);
  });

  test('a thumbnail takes the reader to its page', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf-with-thumbnails');
    const thumbnails = page.getByRole('listbox', { name: 'Pages' });
    await expect(thumbnails.getByRole('option')).toHaveCount(3);
    await expect(thumbnails.getByRole('option', { name: 'Page 1' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await thumbnails.getByRole('option', { name: 'Page 3' }).click();
    await expect(pageIndicator(page)).toHaveText('Page 3 of 3');
    await expect(thumbnails.getByRole('option', { name: 'Page 3' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect.poll(reading(page, 3)).toBe(true);
  });
});

test.describe('zoom', () => {
  test('zoom in, out and reset change the level', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    await resetZoom(page);
    await expect(zoomLevel(page)).toHaveText('100%');

    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => percent(page)).toBeGreaterThan(100);

    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect(zoomLevel(page)).toHaveText('100%');
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => percent(page)).toBeLessThan(100);

    await resetZoom(page);
    await expect(zoomLevel(page)).toHaveText('100%');
  });

  test('zooming keeps the page being read in view', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    await resetZoom(page);
    await expect(zoomLevel(page)).toHaveText('100%');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);

    for (const button of ['Zoom in', 'Zoom in', 'Zoom out', 'Zoom out', 'Zoom out']) {
      await page.getByRole('button', { name: button }).click();
      await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
      await expect.poll(reading(page, 2)).toBe(true);
    }
  });

  test('Ctrl+wheel zooms and keeps the page being read in view', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    await resetZoom(page);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);

    // The same event a trackpad pinch (or Ctrl+wheel) sends; a synthetic one behaves alike in all browsers
    const wheel = (deltaY: number) =>
      pdfPage(page, 2).evaluate((element, delta) => {
        const box = element.getBoundingClientRect();
        element.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: delta,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
            clientX: box.left + box.width / 2,
            clientY: box.top + box.height / 2,
          })
        );
      }, deltaY);

    await wheel(-120);
    await expect.poll(() => percent(page)).toBeGreaterThan(100);
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);

    await wheel(240);
    await expect.poll(() => percent(page)).toBeLessThan(100);
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);
  });
});

test.describe('search', () => {
  /** Characters painted by the browser's highlight API for the current match, or null without the API */
  const activeMatchText = (page: Page) =>
    page.evaluate(() => {
      const registry = (CSS as unknown as { highlights?: Map<string, Set<Range>> }).highlights;
      const ranges = registry?.get('mantine-doc-viewer-active-match');
      return registry ? [...(ranges ?? [])].map((range) => range.toString()).join('|') : null;
    });

  test('finds matches, highlights the current one and moves with Enter', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    await page.getByRole('button', { name: 'Search' }).click();
    const input = page.getByRole('textbox', { name: 'Search document' });
    await expect(input).toBeFocused();

    await input.fill('Line 7 of');
    await expect(
      page.getByRole('status').filter({ hasText: 'Match 1 of 3, page 1' })
    ).toBeAttached();
    await expect.poll(() => activeMatchText(page)).not.toBe('');

    await input.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Match 2 of 3, page 2' })
    ).toBeAttached();
    await expect(pageIndicator(page)).toHaveText('Page 2 of 3');
    await expect.poll(reading(page, 2)).toBe(true);
    // Browsers without the highlight API (null) still search and scroll
    await expect.poll(() => activeMatchText(page)).not.toBe('');

    await input.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Match 3 of 3, page 3' })
    ).toBeAttached();
    await expect(pageIndicator(page)).toHaveText('Page 3 of 3');

    await input.press('Shift+Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Match 2 of 3, page 2' })
    ).toBeAttached();

    await input.press('Escape');
    await expect(input).toBeHidden();
    await expect.poll(async () => (await activeMatchText(page)) ?? '').toBe('');
  });

  test('a query with no match says so', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('textbox', { name: 'Search document' }).fill('zzzzzz');
    await expect(page.getByRole('search')).toContainText(/no (results|matches)|0/i);
    await expect(page.getByRole('button', { name: 'Next match' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});

test.describe('full screen', () => {
  test('the Full screen button toggles and exits', async ({ page }) => {
    await openPdf(page, 'docviewer--pdf');
    const toggle = page.getByRole('button', { name: /full screen/i });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  });
});
