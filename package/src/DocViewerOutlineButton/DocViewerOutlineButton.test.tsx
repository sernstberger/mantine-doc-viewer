import { render, screen, tests } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerOutlineButton,
  DocViewerOutlineButtonProps,
  DocViewerOutlineButtonStylesNames,
} from './DocViewerOutlineButton';

const OUTLINE = [{ title: 'Costs', dest: 'costs', items: [] }];

/** A loaded PDF whose outline is read synchronously, so parts that wait for it render at once */
function createSession(outline: unknown[] | null = OUTLINE) {
  const { document } = mockPdf({ outline });
  const items = outline;
  document.getOutline = jest.fn(() => ({
    then: (resolve: (value: unknown) => void) => resolve(items),
  })) as never;
  return { loaded: { ready: { document } } };
}

function createHarness(
  options: { outline?: unknown[] | null; actions?: Record<string, unknown> } = {}
) {
  return createPartHarness(DocViewerOutlineButton, {
    state: { type: 'pdf' },
    session: createSession(options.outline),
    actions: options.actions,
  });
}

describe('mantine-doc-viewer/DocViewerOutlineButton', () => {
  const { Harness } = createHarness();

  tests.itSupportsSystemProps<DocViewerOutlineButtonProps, DocViewerOutlineButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerOutlineButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerOutlineButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('opens the outline in a dropdown and goes to the page of an entry through the store', async () => {
    const goToPage = jest.fn();
    const { Harness: Outline } = createHarness({ actions: { goToPage } });
    render(<Outline classNames={{ dropdown: 'app-dropdown' }} />);
    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(document.querySelector('.app-dropdown')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Costs' }));
    await waitFor(() => expect(goToPage).toHaveBeenCalledWith(2, undefined));
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('renders nothing for a PDF without an outline', () => {
    const { Harness: Empty } = createHarness({ outline: [] });
    const { Harness: Missing } = createHarness({ outline: null });
    render(
      <>
        <Empty />
        <Missing />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Outline' })).not.toBeInTheDocument();
  });

  it('renders nothing before the PDF is loaded, and when hidden by toolbarControls', () => {
    const { Harness: Loading } = createPartHarness(DocViewerOutlineButton, {
      state: { type: 'pdf' },
    });
    const { Harness: Hidden } = createPartHarness(DocViewerOutlineButton, {
      state: { type: 'pdf' },
      session: createSession(),
      viewerProps: { toolbarControls: { outline: false } },
    });
    render(
      <>
        <Harness />
        <Loading />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Outline' })).toHaveLength(1);
  });
});
