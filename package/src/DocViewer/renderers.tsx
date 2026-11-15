import React from 'react';
import { getRegionProps } from './a11y';
import { useControlProps } from './controls';
import type { DocType } from './detect-doc-type';
import { useDocumentTitle, useDocViewerContext } from './DocViewer.context';

export interface DocViewerFile {
  src: string;
  fileName: string | undefined;
  mimeType: string | undefined;

  /** Type detected by the viewer, `'unknown'` for files it cannot show itself */
  type: DocType;
}

/** Shows file types the viewer does not support, or replaces how it shows a type */
export interface DocViewerRenderer {
  /** Returns `true` for files this renderer shows. Renderers are checked in order, before the built-in views */
  test: (file: DocViewerFile) => boolean;

  /** Renders the file, usually a `DocViewerToolbar` followed by a `DocViewerBody` */
  render: (file: DocViewerFile) => React.ReactNode;
}

/** Viewer state for custom renderers: Styles API, labels, events, the controller and toolbar button props */
export function useDocViewer() {
  const context = useDocViewerContext();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  return { ...context, controlProps, title };
}

export interface DocViewerBodyProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Makes the body a named, focusable region, set it once the content has loaded, `true` by default */
  focusable?: boolean;
}

/** Scrollable area under the toolbar, with the viewer's styles and accessibility */
export const DocViewerBody = React.forwardRef<HTMLDivElement, DocViewerBodyProps>(
  function DocViewerBody({ focusable = true, className, style, children, ...others }, ref) {
    const { getStyles } = useDocViewerContext();
    const title = useDocumentTitle();

    return (
      <div
        ref={ref}
        {...getStyles('body', { className, style })}
        {...getRegionProps(focusable, title)}
        {...others}
      >
        {children}
      </div>
    );
  }
);
