// Helpers for the doc-viewer specs. Specific to this repo, unlike support/story.ts, which is shared
import type { Locator, Page } from '@playwright/test';
import { expect, openStory, type StoryOptions } from './story';

/** Reading position in the toolbar, "Page 2 of 3" */
export const pageIndicator = (page: Page) =>
  page.getByRole('toolbar', { name: 'Document toolbar' }).getByText(/^Page \d+ of \d+$/);

/** The scrolling pages of the open PDF */
export const pdfPages = (page: Page) =>
  page.getByRole('region').filter({ has: page.getByRole('group', { name: /^Page 1 of/ }) });

/** One page of the open PDF, found by its number */
export const pdfPage = (page: Page, number: number) =>
  page.getByRole('group', { name: new RegExp(`^Page ${number} of`) });

/** Opens a PDF story and waits until the first page has painted its canvas */
export async function openPdf(page: Page, id: string, options?: StoryOptions) {
  await openStory(page, id, options);
  await expect(pageIndicator(page)).toHaveText(/^Page 1 of \d+$/);
  await expect(pdfPage(page, 1).locator('canvas')).toBeVisible();
}

/**
 * How much of `locator` is in view of its scrolling ancestor, from 0 to 1, measured against the
 * smaller of the two (a page taller than the view fills the view at best). Says which page is read
 */
export async function visibleShare(locator: Locator) {
  return locator.evaluate((element) => {
    let scroller: Element = document.scrollingElement!;
    for (let node = element.parentElement; node; node = node.parentElement) {
      if (
        /(auto|scroll)/.test(getComputedStyle(node).overflowY) &&
        node.scrollHeight > node.clientHeight
      ) {
        scroller = node;
        break;
      }
    }
    const view = scroller.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const overlap = Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top);
    return Math.max(0, overlap) / Math.min(box.height, view.height);
  });
}

/** The zoom button's percentage, "160%" */
export const zoomLevel = (page: Page) => page.getByRole('button', { name: /Reset zoom to 100%/ });
