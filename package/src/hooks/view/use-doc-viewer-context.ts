import type { GetStylesApi } from '@mantine/core';
import type { DocViewerLabels } from '../../default-labels';
import { useDocumentTitle, useDocViewerContext as useRootContext } from '../../doc-viewer.context';
import type { DocViewerStore } from '../../doc-viewer.store';
import type { DocViewerRootFactory } from '../../DocViewerRoot/DocViewerRoot';
import { useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import type { DocViewerType } from '../../utils/get-doc-viewer-type';

export interface UseDocViewerContextReturnValue {
  /** Styles API of the viewer, for example `getStyles('control')` for a toolbar button */
  getStyles: GetStylesApi<DocViewerRootFactory>;

  /** Labels of the viewer, with the ones passed in `labels` */
  labels: DocViewerLabels;

  /** Url of the document */
  src: string;

  /** Type of the document, from `type` or detected from `src`, `fileName` and `mimeType` */
  type: DocViewerType;

  /** Name of the document, from `fileName` or the last part of `src` */
  fileName: string | undefined;

  /** Title shown in the toolbar: `fileName`, or the document label when there is none */
  title: string;

  /** Store of the viewer, to read its state with `useDocViewerStore` */
  store: DocViewerStore;

  /** Props of a toolbar button: `controlProps(pressed)` styles it as the built-in controls */
  controlProps: ReturnType<typeof useControlProps>;
}

/** Reads the viewer from a custom view or control inside `DocViewer.Root` */
export function useDocViewerContext(): UseDocViewerContextReturnValue {
  const { getStyles, labels, src, type, fileName, store } = useRootContext();
  const controlProps = useControlProps();
  const title = useDocumentTitle();
  return { getStyles, labels, src, type, fileName, title, store, controlProps };
}
