import { createPageEditorExtension } from '../page-editor-extension';
import { getSaveHandler } from './get-save-handler';

const bytes = new Uint8Array([1]);

describe('getSaveHandler', () => {
  it('hands each reason to its editor callback', async () => {
    const onDocumentChange = jest.fn();
    const onExtract = jest.fn();
    const save = getSaveHandler(
      createPageEditorExtension({ onDocumentChange, onExtract }).options as never,
      'a.pdf'
    );
    await save(bytes, { reason: 'save', pages: [1] });
    await save(bytes, { reason: 'reorder', pages: [2, 1] });
    await save(bytes, { reason: 'extract', pages: [2] });
    expect(onDocumentChange).toHaveBeenCalledWith(bytes, { reason: 'save', pages: [1] });
    expect(onDocumentChange).toHaveBeenCalledWith(bytes, { reason: 'reorder', pages: [2, 1] });
    expect(onExtract).toHaveBeenCalledWith(bytes, { pages: [2] });
  });

  it('downloads saved and extracted documents without a callback', async () => {
    const createObjectURL = jest.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL, revokeObjectURL: jest.fn() });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const save = getSaveHandler(createPageEditorExtension().options as never, 'a.PDF');
    await save(bytes, { reason: 'save', pages: [1] });
    await save(bytes, { reason: 'extract', pages: [1] });
    await save(bytes, { reason: 'delete', pages: [1] });
    expect(click.mock.contexts.map((link) => (link as HTMLAnchorElement).download)).toEqual([
      'a-edited.pdf',
      'a-pages.pdf',
    ]);
    click.mockRestore();
  });

  it('names a download after a document without a file name', async () => {
    Object.assign(URL, { createObjectURL: jest.fn(() => 'blob:x'), revokeObjectURL: jest.fn() });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await getSaveHandler(createPageEditorExtension().options as never, undefined)(bytes, {
      reason: 'extract',
      pages: [1],
    });
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('document-pages.pdf');
    click.mockRestore();
  });
});
