// The page editor from the keyboard: moving and deleting pages while focus stays in the list.
// WebKit does not focus a button on click, so the editor is opened with focus() and Enter
import type { Page } from '@playwright/test';
import { openPdf } from './support/doc';
import { expect, test } from './support/story';

const pages = (page: Page) => page.getByRole('listbox', { name: 'Pages' });

/** Labels of the pages in the editor, in order, e.g. "Page 2, position 1 of 3" */
const order = (page: Page) =>
  pages(page)
    .getByRole('option')
    .evaluateAll((options) => options.map((option) => option.getAttribute('aria-label')));

/** The option that has keyboard focus, or null when focus is anywhere else */
const focusedOption = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    return active?.getAttribute('role') === 'option' ? active.getAttribute('aria-label') : null;
  });

async function openEditor(page: Page) {
  await openPdf(page, 'docviewerpageeditor--usage');
  await page.getByRole('button', { name: 'Edit pages' }).focus();
  await page.keyboard.press('Enter');
  await expect(pages(page).getByRole('option')).toHaveCount(3);
  // Focus moves into the list by itself
  await expect.poll(() => focusedOption(page)).toBe('Page 1, position 1 of 3');
}

test('opening the editor puts focus on the first page', async ({ page }) => {
  await openEditor(page);
  await expect(page.getByText('0 selected')).toBeVisible();
});

test('arrow keys move focus between pages', async ({ page }) => {
  await openEditor(page);

  await page.keyboard.press('ArrowRight');
  await expect.poll(() => focusedOption(page)).toBe('Page 2, position 2 of 3');
  await page.keyboard.press('End');
  await expect.poll(() => focusedOption(page)).toBe('Page 3, position 3 of 3');
  await page.keyboard.press('Home');
  await expect.poll(() => focusedOption(page)).toBe('Page 1, position 1 of 3');
});

test('Alt+arrow moves the focused page and focus follows it', async ({ page }) => {
  await openEditor(page);

  await page.keyboard.press('Alt+ArrowRight');
  await expect
    .poll(() => order(page))
    .toEqual(['Page 2, position 1 of 3', 'Page 1, position 2 of 3', 'Page 3, position 3 of 3']);
  await expect.poll(() => focusedOption(page)).toBe('Page 1, position 2 of 3');
  // The roving tab stop follows a frame later (move() in use-page-editor-state sets focusedIndex in
  // requestAnimationFrame); a key pressed before that moves the page at the old index
  await expect(pages(page).locator('[tabindex="0"]')).toHaveAttribute(
    'aria-label',
    'Page 1, position 2 of 3'
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'Page 1 moved to position 2' })
  ).toBeAttached();

  await page.keyboard.press('Alt+ArrowLeft');
  await expect
    .poll(() => order(page))
    .toEqual(['Page 1, position 1 of 3', 'Page 2, position 2 of 3', 'Page 3, position 3 of 3']);
  await expect.poll(() => focusedOption(page)).toBe('Page 1, position 1 of 3');
});

test('Delete removes the focused page and focus stays in the list', async ({ page }) => {
  await openEditor(page);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => focusedOption(page)).toBe('Page 2, position 2 of 3');

  await page.keyboard.press('Delete');
  await expect
    .poll(() => order(page))
    .toEqual(['Page 1, position 1 of 2', 'Page 3, position 2 of 2']);
  await expect(page.getByRole('status').filter({ hasText: '1 page removed' })).toBeAttached();
  // Focus is on a page of the list, not lost to the body
  await expect.poll(() => focusedOption(page)).toBe('Page 3, position 2 of 2');

  // Reset brings the page back
  await page.getByRole('button', { name: 'Reset' }).focus();
  await page.keyboard.press('Enter');
  await expect(pages(page).getByRole('option')).toHaveCount(3);
});

test('Space selects pages, and Escape clears the selection before it leaves', async ({ page }) => {
  await openEditor(page);

  await page.keyboard.press('Space');
  await expect(pages(page).getByRole('option', { name: /^Page 1,/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(page.getByText('1 selected')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('0 selected')).toBeVisible();
  await expect(pages(page)).toBeVisible();

  // With nothing selected Escape leaves the editor, like Cancel, and the reader is back
  await page.keyboard.press('Escape');
  await expect(pages(page).getByRole('option', { name: /position/ })).toHaveCount(0);
  // Focus returns to the button that opened the editor
  await expect(page.getByRole('button', { name: 'Edit pages' })).toBeFocused();
});
