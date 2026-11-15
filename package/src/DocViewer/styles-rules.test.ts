import fs from 'node:fs';
import path from 'node:path';
import { HIGHLIGHT_CSS } from './pdf/highlights';

const css = fs.readFileSync(path.join(__dirname, 'DocViewer.module.css'), 'utf8');

/** The text of the rule that starts with `selector`, up to its closing brace at the same depth */
function ruleOf(selector: string) {
  const start = `\n${css}`.indexOf(`\n${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let index = css.indexOf('{', start); index < css.length; index += 1) {
    depth += css[index] === '{' ? 1 : css[index] === '}' ? -1 : 0;
    if (depth === 0) {
      return css.slice(start, index + 1);
    }
  }
  throw new Error(`Rule ${selector} is not closed`);
}

describe('DocViewer.module.css rules', () => {
  it('shows the drag handle on touch screens in the page editor as well as on the current thumbnail', () => {
    const coarse = ruleOf('.dragHandle').match(/@media \(pointer: coarse\) \{[^}]*\{[^}]*\}/)![0];
    expect(coarse).toContain('.thumbnail[data-active]');
    expect(coarse).toContain('.editorPage');
    expect(coarse).toContain('display: grid');
  });

  it('makes the thumbnail delete button untappable and hidden on touch screens until its thumbnail is current', () => {
    const coarse = ruleOf('.thumbnailDelete').match(
      /@media \(pointer: coarse\) \{[\s\S]*\n {2}\}/
    )![0];
    const [hidden, current] = coarse.split(':where(.thumbnail[data-active]) > &');
    expect(hidden).toContain('visibility: hidden');
    expect(hidden).toContain('pointer-events: none');
    expect(current).toContain('visibility: visible');
    expect(current).toContain('pointer-events: auto');
  });

  it('scopes the drag to reorder styles to the two module classes', () => {
    expect(css).not.toMatch(/^\[data-reorder-item\]/m);
    expect(css).toContain(':is(.thumbnail, .editorPage) {');
  });

  it('does not style Mantine components through their static classes', () => {
    expect(css).not.toContain('mantine-Divider');
    expect(css).not.toMatch(/:global\(\.mantine-/);
  });

  it('keeps variant and presentation rules at low specificity, so classNames win', () => {
    const rules = [
      ":where(.root[data-variant='plain']) .toolbar {",
      ":where(.root[data-variant='plain']) .body {",
      ":where(.root[data-variant='plain']) .page {",
      ':where(.main[data-presenting]) > .body {',
    ];
    rules.forEach((rule) => expect(css).toContain(rule));
    expect(css).not.toMatch(/\.root\[data-variant='plain'\]\s+[&.]/);
    expect(css).not.toMatch(/\.root\[data-page-color-scheme[^\n]*\.page/);
  });

  it('puts the page filter on the root as a variable, for both dark schemes', () => {
    expect(ruleOf('.canvas')).toContain('filter: var(--_page-filter)');
    expect(ruleOf(".root[data-page-color-scheme='dark']")).toContain('--_page-filter: invert');
    expect(ruleOf(".root[data-page-color-scheme='auto']")).toMatch(
      /@mixin dark \{[^}]*--_page-filter/
    );
  });

  it('gives the viewer its own stacking context and text colour', () => {
    const root = ruleOf('.root');
    expect(root).toContain('isolation: isolate');
    expect(root).toContain('color: var(--mantine-color-text)');
  });

  it('uses logical properties for the sides of the thumbnails, handle, delete button and drop bar', () => {
    ['.thumbnails', '.dragHandle', '.thumbnailDelete', ':is(.thumbnail, .editorPage)'].forEach(
      (selector) => expect(ruleOf(selector)).not.toMatch(/\b(left|right|border-left|border-right):/)
    );
    expect(ruleOf('.thumbnails')).toContain('border-inline-end');
    expect(ruleOf('.dragHandle')).toContain('inset-inline-end');
    expect(ruleOf('.thumbnailDelete')).toContain('inset-inline-start');
  });

  it('uses theme tokens for the search match colours', () => {
    const colours = ruleOf('.highlight');
    expect(colours).toContain('var(--mantine-color-orange-6)');
    expect(colours).toContain('var(--mantine-color-orange-9)');
    expect(HIGHLIGHT_CSS).toContain('var(--mantine-color-yellow-6)');
    expect(HIGHLIGHT_CSS).toContain('var(--mantine-color-orange-6)');
    expect(HIGHLIGHT_CSS).toContain('var(--mantine-color-orange-9)');
    expect(HIGHLIGHT_CSS).not.toMatch(/rgb\(/);
    expect(colours).not.toMatch(/rgb\(/);
  });
});
