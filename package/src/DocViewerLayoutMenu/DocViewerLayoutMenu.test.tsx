import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerLayoutMenu,
  DocViewerLayoutMenuProps,
  DocViewerLayoutMenuStylesNames,
} from './DocViewerLayoutMenu';

const { Harness } = createPartHarness(DocViewerLayoutMenu, { state: { type: 'pdf' } });

describe('mantine-doc-viewer/DocViewerLayoutMenu', () => {
  tests.itSupportsSystemProps<DocViewerLayoutMenuProps, DocViewerLayoutMenuStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerLayoutMenu',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerLayoutMenu,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('applies classNames and styles to the dropdown', async () => {
    render(<Harness classNames={{ dropdown: 'app-dropdown' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page layout' }));
    expect(document.querySelector('.app-dropdown')).toContainElement(
      screen.getByRole('radio', { name: 'Single pages' })
    );
  });

  it('sets the layout through the store', async () => {
    const setPageLayout = jest.fn();
    const { Harness: Layouts } = createPartHarness(DocViewerLayoutMenu, {
      state: { type: 'pdf' },
      actions: { setPageLayout },
    });
    render(<Layouts />);
    const button = screen.getByRole('button', { name: 'Page layout' });
    expect(button).not.toHaveAttribute('data-pressed');

    await userEvent.click(button);
    expect(screen.getByRole('radio', { name: 'Single pages' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Two pages' }));
    expect(setPageLayout).toHaveBeenCalledWith('two-page');
  });

  it('marks a layout other than single as pressed', () => {
    const { Harness: Spread } = createPartHarness(DocViewerLayoutMenu, {
      state: { type: 'pdf', pageLayout: 'two-page' },
    });
    render(<Spread />);
    expect(screen.getByRole('button', { name: 'Page layout' })).toHaveAttribute(
      'data-pressed',
      'true'
    );
  });

  it('passes unstyled to the Mantine components in the menu', async () => {
    const { Harness: Unstyled } = createPartHarness(DocViewerLayoutMenu, {
      state: { type: 'pdf' },
      rootProps: { unstyled: true },
    });
    render(<Unstyled />);
    await userEvent.click(screen.getByRole('button', { name: 'Page layout' }));
    expect(screen.getByRole('dialog').querySelectorAll('[class*="m_"]')).toHaveLength(0);
  });

  it('lists the layouts it is given', async () => {
    render(<Harness layouts={['single', 'wrapped']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page layout' }));
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('renders nothing for other documents', () => {
    const { Harness: Image } = createPartHarness(DocViewerLayoutMenu, {
      src: '/files/photo.png',
      state: { type: 'image' },
    });
    render(
      <>
        <Image />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Page layout' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerLayoutMenu, {
      ...{ state: { type: 'pdf' } },
      viewerProps: { toolbarControls: { layout: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Page layout' })).toHaveLength(1);
  });
});
