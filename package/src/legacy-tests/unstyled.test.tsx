import { render, screen } from '@mantine-tests/core';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewerRoot/DocViewerRoot';
import { BEHAVIOR_SELECTORS } from '../DocViewerRoot/use-behavior-styles';

const behaviorCss = fs.readFileSync(
  path.join(__dirname, '../DocViewer.behavior.module.css'),
  'utf8'
);

const PDF = { src: '/files/report.pdf', pdfWorkerSrc: '/worker.mjs' } as const;

describe('unstyled', () => {
  beforeEach(() => getDocument.mockReset());

  it('drops the looks of the viewer but keeps the classes the page layers work with', async () => {
    mockPdf();
    render(<DocViewer {...PDF} unstyled />);
    const pages = await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    // The viewer has no module class of its own, the layers keep theirs
    expect(document.querySelector('[data-doc-type]')).not.toHaveClass('root');
    for (const selector of ['pages', 'page', 'canvas', 'textLayer']) {
      expect(document.querySelector(`.${selector}`)).toBeInTheDocument();
    }
    expect(pages[0]).toHaveClass('page');
    expect(pages[0].querySelector('.textLayer')).toBeInTheDocument();
  });

  it('also keeps the link and markup layers, and the overlay and highlight layers', async () => {
    mockPdf();
    render(
      <DocViewer
        {...PDF}
        unstyled
        withMarkup
        renderPageOverlay={() => <span>Over</span>}
        defaultMarkupTool="pen"
      />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    for (const selector of ['markupLayer', 'pageOverlay']) {
      expect(document.querySelector(`.${selector}`)).toBeInTheDocument();
    }
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
