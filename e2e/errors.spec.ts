// Stories that fail on purpose: what the reader sees, and the console message a developer gets.
import { firstLoad } from './support/doc';
import { expect, openStory, test } from './support/story';

test.describe('PDF without a worker', () => {
  test.use({ allowConsole: [/pdf\.js worker is not configured/] });

  test('the reader sees a message, the developer gets the console error', async ({ page }) => {
    const logged: string[] = [];
    page.on('console', (message) => logged.push(message.text()));
    await openStory(page, 'docviewer--pdf-without-worker');

    await expect(page.getByRole('alert')).toContainText('PDF preview is not configured', firstLoad);
    await expect.poll(() => logged.join('\n')).toContain('pdf.js worker is not configured');
  });
});

test('a PDF that cannot be loaded says so', async ({ page }) => {
  // The 404 of the missing file is logged by the browser itself
  test.info().annotations.push({ type: 'note', description: 'the browser logs the 404' });
  await openStory(page, 'docviewer--pdf-load-error');
  await expect(page.getByRole('alert')).toContainText('This PDF could not be opened', firstLoad);
});

test('an image that cannot be loaded says so', async ({ page }) => {
  await openStory(page, 'docviewer--image-load-error');
  await expect(page.getByRole('alert')).toContainText('This image could not be loaded', firstLoad);
});
