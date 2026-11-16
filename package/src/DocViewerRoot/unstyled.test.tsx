import { render, screen } from '@mantine-tests/core';
import fs from 'node:fs';
import path from 'node:path';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';
import { BEHAVIOR_SELECTORS } from './use-behavior-styles';

const behaviorCss = fs.readFileSync(
  path.join(__dirname, '../DocViewer.behavior.module.css'),
  'utf8'
);

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
