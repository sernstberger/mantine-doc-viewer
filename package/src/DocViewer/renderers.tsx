import { useMergedRef } from '@mantine/hooks';
import React, { useCallback, useState } from 'react';
import type { DocViewerLoadInfo } from './controller';
import { getRegionProps } from './a11y';
import { useControlProps } from './controls';
import type { DocType } from './detect-doc-type';
import { useDocumentTitle, useDocViewerContext } from './DocViewer.context';
import { useKeepScroll } from './keep-scroll';

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

/**
 * Viewer state for custom renderers: Styles API, labels, events, the controller and toolbar button
 * props, and two helpers to report the outcome: `onLoad` when the file is shown and `onError` when it
 * could not be loaded. They call the viewer's `onDocumentLoad` and `onDocumentError`. `onLoad` fills
 * in the `type` and `mimeType` of the file, so `onLoad()` is enough
 */
export function useDocViewer() {
  const context = useDocViewerContext();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  const { events, type, mimeType } = context;
  const onLoad = useCallback(
    (info?: Partial<DocViewerLoadInfo>) => events.onDocumentLoad({ type, mimeType, ...info }),
    [events, type, mimeType]
  );
  const onError = events.onDocumentError;
  return { ...context, controlProps, title, onLoad, onError };
}

export interface DocViewerBodyProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Makes the body a named, focusable region, set it once the content has loaded, `true` by default */
  focusable?: boolean;
}

/** Scrollable area under the toolbar, with the viewer's styles and accessibility */
export const DocViewerBody = React.forwardRef<HTMLDivElement, DocViewerBodyProps>(
  function DocViewerBody({ focusable = true, className, style, children, ...others }, ref) {
    const { getStyles, src, keepView } = useDocViewerContext();
    const title = useDocumentTitle();
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    useKeepScroll(node, focusable, src, keepView);
    const mergedRef = useMergedRef(ref, setNode);

    return (
      <div
        ref={mergedRef}
        {...getStyles('body', { className, style })}
        {...getRegionProps(focusable, title)}
        {...others}
      >
        {children}
      </div>
    );
  }
);
