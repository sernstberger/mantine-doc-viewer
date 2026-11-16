import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import {
  createReadyPdfRoot,
  LoadedPdfRoot,
  loadReadyState,
  pagesLoaded,
  PdfPartsRoot,
} from '../../../test-utils/pdf-parts';
import {
  DocViewerDocumentInfo,
  type DocViewerDocumentInfoProps,
  type DocViewerDocumentInfoStylesNames,
} from './DocViewerDocumentInfo';

let ready: Awaited<ReturnType<typeof loadReadyState>>;
const ReadyRoot = createReadyPdfRoot(() => ready);

beforeAll(async () => {
  ready = await loadReadyState({ numPages: 3 });
});

const TestContainer = createContextContainer(DocViewerDocumentInfo, ReadyRoot);
const defaultProps: DocViewerDocumentInfoProps = {};

describe('mantine-doc-viewer/DocViewerDocumentInfo', () => {
  tests.itSupportsSystemProps<DocViewerDocumentInfoProps, DocViewerDocumentInfoStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerDocumentInfo',
    stylesApiSelectors: ['documentInfo', 'documentHeading', 'properties'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-documentInfo',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerDocumentInfo,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing before the document is loaded', () => {
    render(
      <PdfPartsRoot>
        <DocViewerDocumentInfo />
      </PdfPartsRoot>
    );
    expect(document.querySelector('.mantine-DocViewer-documentInfo')).not.toBeInTheDocument();
  });
});

describe('DocViewerDocumentInfo in a loaded viewer', () => {
  beforeEach(() => {
    getDocument.mockReset();
    URL.createObjectURL = jest.fn(() => 'blob:attachment');
    URL.revokeObjectURL = jest.fn();
  });

  it('lists the properties, the attachments and the layers of the document', async () => {
    mockPdf({
      numPages: 3,
      attachments: new Map([['a.txt', { filename: 'a.txt', description: '' }]]),
      layers: [{ id: 'l1', name: 'Notes layer', visible: true }],
    });
    const { container } = render(
      <LoadedPdfRoot>
        <DocViewerDocumentInfo
          classNames={{ documentHeading: 'my-heading', documentLayer: 'my-layer' }}
        />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);

    expect(await screen.findByText('Finance')).toBeInTheDocument();
    expect(document.querySelectorAll('.my-heading')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Download attachment a.txt' })).toBeInTheDocument();
    const layer = screen.getByRole('checkbox', { name: 'Notes layer' });
    expect(layer.closest('.my-layer')).toBeInTheDocument();
    expect(layer).toBeChecked();

    await userEvent.click(layer);
    expect(screen.getByRole('checkbox', { name: 'Notes layer' })).not.toBeChecked();
  });

  it('passes unstyled to the Mantine components inside', async () => {
    mockPdf({
      numPages: 3,
      attachments: new Map([['a.txt', { filename: 'a.txt', description: '' }]]),
      layers: [{ id: 'l1', name: 'Notes layer', visible: true }],
    });
    const { container } = render(
      <LoadedPdfRoot unstyled>
        <DocViewerDocumentInfo />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    await screen.findByText('Finance');
    const info = document.querySelector('.mantine-DocViewer-documentInfo')!;
    expect(info.querySelectorAll('[class*="m_"]')).toHaveLength(0);
  });
});
