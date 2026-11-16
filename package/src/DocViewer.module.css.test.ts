import fs from 'node:fs';
import path from 'node:path';
import { HIGHLIGHT_CSS } from './utils/highlights';

const css = fs.readFileSync(path.join(__dirname, './DocViewer.module.css'), 'utf8');

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

describe('DocViewer.module.css', () => {
  it('has no custom property that refers to itself, which would make it invalid', () => {
    const selfReferences = Array.from(css.matchAll(/(--[\w-]+)\s*:([^;]+);/g))
      .filter(([, name, value]) => value.includes(`var(${name})`) || value.includes(`var(${name},`))
      .map(([declaration]) => declaration.trim());

    expect(selfReferences).toEqual([]);
  });

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

  it('gives the thumbnail delete button a 44px target on touch screens', () => {
    const coarse = ruleOf('.thumbnailDelete').match(
      /@media \(pointer: coarse\) \{[\s\S]*\n {2}\}/
    )![0];
    expect(coarse).toContain('min-width: rem(44px)');
    expect(coarse).toContain('min-height: rem(44px)');
  });

  it('scopes the soft-disabled look to the toolbar buttons and takes the hover and press cues off', () => {
    expect(css).not.toMatch(/^:where\(\[data-soft-disabled\]\)/m);
    const rule = ruleOf('.control[data-soft-disabled],\n.markupSave[data-soft-disabled]');
    expect(rule).toContain('opacity: 0.4');
    expect(rule).toContain('cursor: not-allowed');
    expect(rule).toContain('&:hover,\n  &:active');
    expect(rule).toContain('transform: none');
  });

  it('dims the unavailable presentation buttons without the disabled background', () => {
    const rule = ruleOf('.presentationControls .control');
    expect(rule).toMatch(
      /&\[data-disabled\] \{[^}]*background-color: transparent;[^}]*opacity: 0.4;/
    );
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

  it('marks pressed buttons in forced colors by their data attribute, wherever they are', () => {
    const forced = css.slice(css.indexOf('@media (forced-colors: active) {'));
    expect(forced).toContain(
      ":is(.control, .overlayControl):is([data-pressed], [aria-pressed='true'])"
    );
    expect(css).not.toContain('.toolbar [aria-pressed');
  });

  it('screens highlights over dark pages, where multiplying would make them disappear', () => {
    expect(ruleOf('.highlight')).toContain('mix-blend-mode: var(--_highlight-blend)');
    expect(ruleOf('.root')).toContain('--_highlight-blend: multiply');
    expect(ruleOf(".root[data-page-color-scheme='dark']")).toContain('--_highlight-blend: screen');
    expect(ruleOf(".root[data-page-color-scheme='auto']")).toMatch(
      /@mixin dark \{[^}]*--_highlight-blend: screen/
    );
  });

  it('drops the border and corners in full screen', () => {
    expect(ruleOf('.root[data-fullscreen]')).toMatch(/border: 0;[\s\S]*border-radius: 0;/);
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
