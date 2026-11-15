import type { GetStylesApi } from '@mantine/core';
import { useCallback } from 'react';
import behavior from '../DocViewer.behavior.module.css';
import type { DocViewerFactory } from './DocViewerRoot';

/** The Styles API selectors that pdf.js layers and the page layout need classes on, even `unstyled` */
export const BEHAVIOR_SELECTORS: ReadonlySet<string> = new Set([
  'pages',
  'page',
  'canvas',
  'textLayer',
  'markupLayer',
  'pageOverlay',
  'highlightLayer',
  'linkLayer',
]);

/**
 * `getStyles` that also adds the behaviour classes to the selectors of BEHAVIOR_SELECTORS, which
 * Mantine drops with `unstyled`: `unstyled` removes looks, not what makes the pages work.
 * The same function while `getStyles` is the same
 */
export function useBehaviorStyles(
  getStyles: GetStylesApi<DocViewerFactory>
): GetStylesApi<DocViewerFactory> {
  return useCallback(
    ((selector, options) => {
      const styles = getStyles(selector, options);
      return BEHAVIOR_SELECTORS.has(selector)
        ? { ...styles, className: [styles.className, behavior[selector]].filter(Boolean).join(' ') }
        : styles;
    }) as GetStylesApi<DocViewerFactory>,
    [getStyles]
  );
}
