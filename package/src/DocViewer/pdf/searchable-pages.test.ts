import { readSearchablePages, SEARCH_BATCH_SIZE } from './use-pdf-search';

/** A document whose pages say "page N", counting how many text reads run at once */
function fakeDocument(numPages: number, unreadable = 0) {
  const reads = { running: 0, most: 0, total: 0 };
  const document = {
    numPages,
    getPage: jest.fn((pageNumber: number) =>
      Promise.resolve({
        getTextContent: () => {
          reads.running += 1;
          reads.total += 1;
          reads.most = Math.max(reads.most, reads.running);
          return new Promise((resolve, reject) =>
            setTimeout(() => {
              reads.running -= 1;
              pageNumber === unreadable
                ? reject(new Error('Corrupt content stream'))
                : resolve({ items: [{ str: `page ${pageNumber}`, hasEOL: false }] });
            }, 0)
          );
        },
      })
    ),
  };
  return { document: document as any, reads };
}

describe('readSearchablePages', () => {
  it('reads a batch of pages at a time, not every page at once', async () => {
    const { document, reads } = fakeDocument(20);
    const pages = await readSearchablePages(document, () => false);
    expect(pages!.map((page) => page.text.text)).toEqual(
      Array.from({ length: 20 }, (_, index) => `page ${index + 1}`)
    );
    expect(reads.most).toBe(SEARCH_BATCH_SIZE);
  });

  it('stops between batches once cancelled, and keeps what it read', async () => {
    const { document, reads } = fakeDocument(20);
    let cancelled = false;
    const reading = readSearchablePages(document, () => cancelled);
    cancelled = true;
    expect(await reading).toBeNull();
    expect(reads.total).toBe(SEARCH_BATCH_SIZE);

    // The pages read before are not read again
    const pages = await readSearchablePages(document, () => false);
    expect(reads.total).toBe(20);
    expect(pages).toHaveLength(20);
  });

  it('shares each page between readers, so search and passage highlights hold one copy', async () => {
    const { document } = fakeDocument(3);
    const first = await readSearchablePages(document, () => false);
    const second = await readSearchablePages(document, () => false);
    expect(second).not.toBe(first);
    second!.forEach((page, index) => expect(page).toBe(first![index]));
  });

  it('searches a page that cannot be read as empty, and tries it again next time', async () => {
    const { document, reads } = fakeDocument(2, 2);
    const pages = await readSearchablePages(document, () => false);
    expect(pages![1].text.text).toBe('');
    await readSearchablePages(document, () => false);
    expect(reads.total).toBe(3);
  });
});
