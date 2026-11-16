import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import { createContext, type ReactNode, use, useMemo, useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import { useDocViewerExtensionOptions } from '../DocViewerRoot/extensions-context';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { useReturnFocus } from '../hooks/pdf/use-return-focus';
import { useRegisterController } from '../hooks/use-controller-registry';
import { saveBytes } from '../utils/files';
import {
  mergeMarkupLabels,
  type DocViewerMarkupLabels,
  type DocViewerMarkupLabelsInput,
} from './default-labels';
import { useMarkup, type PdfLayerMarkup, type PdfMarkup } from './hooks/use-markup';
import type { DocViewerMarkupOptions } from './markup-extension';
import { getAnnotatedFileName, getMarkedPages, type DocViewerMark } from './utils/markup';

export interface MarkupContextValue {
  markup: PdfMarkup;
  labels: DocViewerMarkupLabels;

  /** Whether the PDF is loaded, so the markup button can show */
  ready: boolean;

  /** Whether the markup bar is open; it is also open while a tool is picked */
  opened: boolean;
  setOpened: (opened: boolean) => void;

  /** Ref of the markup button: focus goes back to it when the bar closes */
  markupRef: (node: HTMLElement | null) => void;

  /** Writes the marks into the PDF and hands the bytes on */
  save: () => Promise<void>;
}

interface MarkupLayerContextValue {
  store: DocViewerStore;
  layer: PdfLayerMarkup;
  marksByPage: ReadonlyMap<number, DocViewerMark[]>;
}

export const MarkupContext = createContext<MarkupContextValue | null>(null);
const MarkupLayerContext = createContext<MarkupLayerContextValue | null>(null);

/** The markup of the viewer, null without the markup extension or outside a PDF */
export function useMarkupContext() {
  return use(MarkupContext);
}

/** What the page layers draw with: the same value while the tool, settings and marks are */
export function useMarkupLayerContext() {
  return use(MarkupLayerContext);
}

/** The extension's labels over the defaults, the same object while no label changes */
function useMarkupLabels(labels: DocViewerMarkupLabelsInput | undefined) {
  const overrides = useShallowStable(labels);
  const toolLabels = useShallowStable(labels?.markupToolLabels);
  return useMemo(
    () => mergeMarkupLabels({ ...overrides, markupToolLabels: toolLabels }),
    [overrides, toolLabels]
  );
}

/**
 * The markup's setup inside the PDF session: the markup state, the actions of the registry, the
 * tool in the store, and the contexts the bar, the button and the page layers read
 */
export function MarkupSetup({ children }: { children: ReactNode }) {
  const { store, controller, fileName } = useDocViewerContext();
  const session = usePdfSession()!;
  const options = useDocViewerExtensionOptions<DocViewerMarkupOptions>('markup')!;
  const labels = useMarkupLabels(options.labels);
  const { announce, scrollToPage } = session.position;
  const markup = useMarkup({ options, labels, announce, scrollToPage });
  const [opened, setOpened] = useState(false);
  const ready = !!session.loaded.ready;
  const markupRef = useReturnFocus(
    opened || markup.tool !== null,
    ready ? session.view.scrollRoot : null
  );

  const save = useCallbackRef(async () => {
    const document = session.loaded.document;
    if (!document || markup.marks.length === 0) {
      return;
    }
    const bytes = await markup.save(document);
    const pages = getMarkedPages(markup.marks);
    if (options.onDocumentChange) {
      await options.onDocumentChange(bytes, { reason: 'annotate', pages });
    } else {
      saveBytes(bytes, getAnnotatedFileName(fileName), 'application/pdf');
    }
    announce(labels.markupSavedLabel);
  });
  useRegisterController(controller, { setMarkupTool: markup.setTool, saveMarkup: save });

  useIsomorphicEffect(() => {
    store.getState().markupTool !== markup.tool &&
      updateDocViewerStateAction({ markupTool: markup.tool }, store);
  }, [store, markup.tool]);

  const { layer, marksByPage } = markup;
  const layerValue = useMemo(() => ({ store, layer, marksByPage }), [store, layer, marksByPage]);
  const value = useMemo(
    () => ({ markup, labels, ready, opened, setOpened, markupRef, save }),
    [markup, labels, ready, opened, markupRef, save]
  );

  return (
    <MarkupContext value={value}>
      <MarkupLayerContext value={layerValue}>{children}</MarkupLayerContext>
    </MarkupContext>
  );
}
