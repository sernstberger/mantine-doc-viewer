import { createContext, use, useMemo } from 'react';
import { useDocViewerContext, type DocViewerContextValue } from '../doc-viewer.context';

type GetStyles = DocViewerContextValue['getStyles'];

interface PageEditorStylesApiProps {
  classNames?: unknown;
  styles?: unknown;
}

const PageEditorStylesContext = createContext<GetStyles | null>(null);
export const PageEditorStylesProvider = PageEditorStylesContext;

/** `getStyles` of the viewer with the `classNames` and `styles` given to `DocViewerPageEditor` */
export function usePageEditorGetStyles({ classNames, styles }: PageEditorStylesApiProps) {
  const { getStyles } = useDocViewerContext();
  return useMemo<GetStyles>(
    () => (selector, options) =>
      getStyles(selector, { classNames, styles, ...options } as Parameters<GetStyles>[1]),
    [getStyles, classNames, styles]
  );
}

/** `getStyles` inside the page editor */
export function usePageEditorStyles() {
  return use(PageEditorStylesContext)!;
}
