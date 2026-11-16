import { render, screen } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '../../../test-utils/mock-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';
import { BEHAVIOR_SELECTORS } from './use-behavior-styles';

const behaviorCss = fs.readFileSync(
  path.join(__dirname, '../DocViewer.behavior.module.css'),
  'utf8'
);

const MANTINE_CLASS = /\bm_[0-9a-f]+\b/;

const BEHAVIOUR_PARTS = /mantine-(VisuallyHidden|FloatingIndicator)-root/;

/** Elements inside the viewer that still carry a class from a Mantine stylesheet, behaviour-only parts aside */
function styledElements() {
  return Array.from(document.querySelectorAll('[data-doc-type] *'))
    .filter((element) => {
      const className = element.getAttribute('class') ?? '';
      return (
        MANTINE_CLASS.test(className) &&
        !BEHAVIOUR_PARTS.test(className) &&
        !element.parentElement?.closest(
          '[class*="mantine-CodeHighlight-"], [class*="mantine-JsonViewer-"]'
        )
      );
    })
    .map((element) => element.outerHTML.slice(0, 300));
}

describe('unstyled', () => {
  beforeEach(() => getDocument.mockReset());

  it('drops the looks of the viewer but keeps the classes the page layers work with', async () => {
    mockPdf();
    render(<TestDocViewer src="/files/report.pdf" unstyled />);
    const pages = await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    expect(document.querySelector('[data-doc-type]')).not.toHaveClass('root');
    for (const selector of ['pages', 'page', 'canvas', 'textLayer']) {
      expect(document.querySelector(`.${selector}`)).toBeInTheDocument();
    }
    expect(pages[0]).toHaveClass('page');
    expect(pages[0].querySelector('.textLayer')).toBeInTheDocument();
  });

  it('passes unstyled to the Mantine components inside the viewer', async () => {
    const mantineClass = /\bm_[0-9a-f]+\b/;
    const buttons = () => Array.from(document.querySelectorAll('.mantine-ActionIcon-root'));
    mockPdf();
    const { rerender } = render(<TestDocViewer src="/files/report.pdf" />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(buttons().length).toBeGreaterThan(0);
    buttons().forEach((button) => expect(button.className).toMatch(mantineClass));

    rerender(
      <>
        <TestDocViewer src="/files/report.pdf" unstyled />
      </>
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(buttons().length).toBeGreaterThan(0);
    buttons().forEach((button) => expect(button.className).not.toMatch(mantineClass));
  });

  it('passes unstyled to the zoom menu, the tooltips and the toolbar of a PDF', async () => {
    const hashed = /\bm_[0-9a-f]+\b/;
    mockPdf();
    const { rerender } = render(<TestDocViewer src="/files/report.pdf" />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    await userEvent.click(screen.getByRole('button', { name: /^Zoom \d+%$/ }));
    expect(screen.getByRole('menuitemradio', { name: '100%' }).className).toMatch(hashed);
    await userEvent.keyboard('{Escape}');

    rerender(
      <>
        <TestDocViewer src="/files/report.pdf" unstyled />
      </>
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(screen.getByRole('button', { name: /^Zoom \d+%$/ }).className).not.toMatch(hashed);
    await userEvent.click(screen.getByRole('button', { name: /^Zoom \d+%$/ }));
    expect(screen.getByRole('menuitemradio', { name: '100%' }).className).not.toMatch(hashed);
    await userEvent.hover(screen.getByRole('button', { name: 'Zoom in' }));
    expect((await screen.findByRole('tooltip')).className).not.toMatch(hashed);
  });

  it('passes unstyled to the page layout, outline and document info popovers', async () => {
    mockPdf({
      outline: [{ title: 'Costs', dest: 'costs', items: [] }],
      attachments: new Map([['a.txt', { filename: 'a.txt', description: '' }]]),
      layers: [{ id: 'l1', name: 'Notes layer', visible: true }],
    });
    render(<TestDocViewer src="/files/report.pdf" unstyled />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    for (const [name, content] of [
      ['Page layout', 'Two pages'],
      ['Outline', 'Costs'],
      ['Document info', 'a.txt'],
    ]) {
      await userEvent.click(await screen.findByRole('button', { name }));
      expect(await screen.findByText(content)).toBeInTheDocument();
      expect(styledElements()).toEqual([]);
      await userEvent.keyboard('{Escape}');
    }
  });

  it('passes unstyled to the code and JSON views', async () => {
    mockFetch('const answer = 42;');
    const { unmount } = render(<TestDocViewer src="/src/answer.ts" unstyled />);
    expect(await screen.findByText(/answer/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading document')).not.toBeInTheDocument());
    expect(styledElements()).toEqual([]);
    unmount();

    mockFetch('{"alpha": 1}');
    render(<TestDocViewer src="/src/data.json" unstyled />);
    expect(await screen.findByText(/alpha/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading document')).not.toBeInTheDocument());
    expect(styledElements()).toEqual([]);
  });

  it('passes unstyled to the markdown preview and its source', async () => {
    mockFetch('# Title');
    render(<TestDocViewer src="/docs/readme.md" unstyled />);
    expect(await screen.findByTestId('markdown')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading document')).not.toBeInTheDocument());
    expect(styledElements()).toEqual([]);
    await userEvent.click(screen.getByRole('radio', { name: /source/i }));
    expect(await screen.findByText(/# Title/)).toBeInTheDocument();
    expect(styledElements()).toEqual([]);
  });

  it('also keeps the page overlay layer', async () => {
    mockPdf();
    render(
      <TestDocViewer
        src="/files/report.pdf"
        unstyled
        pagesProps={{ renderPageOverlay: () => <span>Over</span> }}
      />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(document.querySelector('.pageOverlay')).toBeInTheDocument();
  });

  it('keeps the rules text selection needs: transparent, positioned text over the canvas', () => {
    const textLayer = behaviorCss.slice(behaviorCss.indexOf('.textLayer {'));
    expect(textLayer).toMatch(
      /& :is\(span, br\) \{[^}]*position: absolute;[^}]*color: transparent;/
    );
    expect(textLayer).toMatch(/\.textLayer \{[^}]*position: absolute;/);
  });

  it('keeps the layers out of the way of the pointer until a tool or a child needs it', () => {
    for (const selector of ['markupLayer', 'pageOverlay', 'highlightLayer', 'linkLayer']) {
      const rule = behaviorCss.slice(behaviorCss.indexOf(`.${selector} {`));
      expect(rule.slice(0, rule.indexOf('\n}'))).toContain('pointer-events: none');
    }
    expect(behaviorCss).toMatch(/&\[data-tool\] \{\s*pointer-events: auto;/);
  });

  it('has a rule for every selector it adds a class to', () => {
    for (const selector of BEHAVIOR_SELECTORS) {
      expect(behaviorCss).toContain(`.${selector} {`);
    }
  });
});

describe('root state attributes', () => {
  it('sets data-doc-type and data-page-color-scheme through mod, next to a consumer mod', () => {
    const { container } = render(
      <TestDocViewer src="/files/archive.zip" pageColorScheme="dark" mod={{ mine: true }} />
    );
    const root = container.querySelector('.mantine-DocViewer-root')!;

    expect(root).toHaveAttribute('data-doc-type', 'unknown');
    expect(root).toHaveAttribute('data-page-color-scheme', 'dark');
    expect(root).toHaveAttribute('data-mine', 'true');
  });

  it('leaves out data-page-color-scheme for light pages', () => {
    const { container } = render(
      <TestDocViewer src="/files/archive.zip" pageColorScheme="light" />
    );
    expect(container.querySelector('.mantine-DocViewer-root')).not.toHaveAttribute(
      'data-page-color-scheme'
    );
  });
});
