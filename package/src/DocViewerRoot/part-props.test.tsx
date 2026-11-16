import { act } from 'react';
import { render, screen } from '@mantine-tests/core';
import { mockFetch } from '../../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';
import { DocViewer } from '../DocViewer';
import { DocViewerImage } from '../DocViewerImage/DocViewerImage';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { DocViewerSearch } from '../DocViewerSearch/DocViewerSearch';
import { DocViewerText } from '../DocViewerText/DocViewerText';
import { DocViewerThumbnails } from '../DocViewerThumbnails/DocViewerThumbnails';
import { createDocViewer } from '../doc-viewer.store';

const pagesBody = async () => {
  await screen.findAllByRole('group', { name: /^Page \d of 2$/ });
  return document.querySelector<HTMLElement>('.mantine-DocViewer-body')!;
};

describe('part props of DocViewer', () => {
  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: 2 });
  });

  it('gives pagesProps precedence over theme defaultProps of DocViewerPages', async () => {
    render(
      <TestDocViewer src="/files/report.pdf" pagesProps={{ gap: 'xs', matchColor: 'red' }} />,
      {
        components: {
          DocViewerPages: DocViewerPages.extend({
            defaultProps: { gap: 'xl', matchColor: 'blue' },
          }),
        },
      }
    );
    const body = await pagesBody();
    expect(body.style.getPropertyValue('--doc-viewer-page-gap')).toBe('var(--mantine-spacing-xs)');
    expect(body.style.getPropertyValue('--doc-viewer-match-color')).toBe(
      'var(--mantine-color-red-filled)'
    );
  });

  it('keeps theme defaultProps for what pagesProps does not set', async () => {
    render(<TestDocViewer src="/files/report.pdf" pagesProps={{ matchColor: 'red' }} />, {
      components: { DocViewerPages: DocViewerPages.extend({ defaultProps: { gap: 'xl' } }) },
    });
    const body = await pagesBody();
    expect(body.style.getPropertyValue('--doc-viewer-page-gap')).toBe('var(--mantine-spacing-xl)');
  });

  it('sets the part variables on the parts, not on the root', async () => {
    const { container } = render(
      <TestDocViewer
        src="/files/report.pdf"
        pagesProps={{ gap: 'xl', matchColor: 'grape', activeMatchColor: 'red' }}
        thumbnailsProps={{ width: 80 }}
        defaultThumbnailsOpened
      />
    );
    const body = await pagesBody();
    const root = container.querySelector<HTMLElement>('.mantine-DocViewer-root')!;
    expect(body.style.getPropertyValue('--doc-viewer-page-gap')).toBe('var(--mantine-spacing-xl)');
    expect(body.style.getPropertyValue('--doc-viewer-active-match-color')).toBe(
      'var(--mantine-color-red-filled)'
    );
    expect(
      (await screen.findByRole('listbox')).style.getPropertyValue('--doc-viewer-thumbnails-width')
    ).toBe('calc(5rem * var(--mantine-scale))');
    for (const name of ['page-gap', 'match-color', 'active-match-color', 'thumbnails-width']) {
      expect(root.style.getPropertyValue(`--doc-viewer-${name}`)).toBe('');
    }
  });

  it('passes pagesProps to a composed DocViewer.Pages under its own props', async () => {
    render(
      <TestDocViewer src="/files/report.pdf" pagesProps={{ gap: 'xs', className: 'from-layout' }}>
        <DocViewer.Pages gap={undefined} matchColor="grape" />
      </TestDocViewer>
    );
    const body = await pagesBody();
    expect(body).toHaveClass('from-layout');
    expect(body.style.getPropertyValue('--doc-viewer-page-gap')).toBe('var(--mantine-spacing-xs)');
    expect(body.style.getPropertyValue('--doc-viewer-match-color')).toBe(
      'var(--mantine-color-grape-filled)'
    );
  });

  it('gives thumbnailsProps precedence over theme defaultProps of DocViewerThumbnails', async () => {
    render(
      <TestDocViewer
        src="/files/report.pdf"
        thumbnailsProps={{ width: 80 }}
        defaultThumbnailsOpened
      />,
      {
        components: {
          DocViewerThumbnails: DocViewerThumbnails.extend({ defaultProps: { width: 160 } }),
        },
      }
    );
    expect(
      (await screen.findByRole('listbox')).style.getPropertyValue('--doc-viewer-thumbnails-width')
    ).toBe('calc(5rem * var(--mantine-scale))');
  });

  it('gives searchProps precedence over theme defaultProps of DocViewerSearch', async () => {
    const [store, controller] = createDocViewer();
    render(
      <TestDocViewer
        src="/files/report.pdf"
        store={store}
        searchProps={{ inputProps: { placeholder: 'From the instance' } }}
      />,
      {
        components: {
          DocViewerSearch: DocViewerSearch.extend({
            defaultProps: { inputProps: { placeholder: 'From the theme' } },
          }),
        },
      }
    );
    await pagesBody();
    act(() => controller.openSearch());
    expect(await screen.findByPlaceholderText('From the instance')).toBeInTheDocument();
  });
});

describe('imageProps and textProps of DocViewer', () => {
  it('passes every imageProps prop to the image view', () => {
    render(
      <DocViewer
        src="/files/photo.png"
        imageProps={{
          alt: 'Photo',
          className: 'from-layout',
          classNames: { image: 'layout-image' },
          ...{ 'data-testid': 'image-body' },
        }}
      />
    );
    const body = screen.getByTestId('image-body');
    expect(body).toHaveClass('from-layout');
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveClass('layout-image');
    expect(image).toHaveAttribute('alt', 'Photo');
  });

  it('gives imageProps precedence over theme defaultProps of DocViewerImage', () => {
    render(<DocViewer src="/files/photo.png" imageProps={{ alt: 'From the instance' }} />, {
      components: {
        DocViewerImage: DocViewerImage.extend({ defaultProps: { alt: 'From the theme' } }),
      },
    });
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('alt', 'From the instance');
  });

  it('passes textProps to the text view, leaving out what only code views take', async () => {
    mockFetch('Plain text');
    render(
      <DocViewer
        src="/files/notes.txt"
        textProps={{
          className: 'from-layout',
          ...{ 'data-testid': 'text-body' },
          language: 'json',
          codeHighlightProps: { className: 'unused' },
        }}
      />,
      {
        components: {
          DocViewerText: DocViewerText.extend({ defaultProps: { className: 'theme' } }),
        },
      }
    );
    expect(await screen.findByText('Plain text')).toBeInTheDocument();
    const body = screen.getByTestId('text-body');
    expect(body).toHaveClass('from-layout');
    expect(body).not.toHaveAttribute('language');
  });
});
