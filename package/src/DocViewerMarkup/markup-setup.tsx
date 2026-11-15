import { useCallbackRef, useIsomorphicEffect } from '@mantine/hooks';
import React, { createContext, use, useMemo, useState } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { updateDocViewerStateAction, type DocViewerStore } from '../doc-viewer.store';
import { useDocViewerExtensionOptions } from '../DocViewerRoot/extensions-context';
import { getSaveHandler } from '../DocViewerRoot/get-save-handler';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import {
  useMarkup,
  type DocViewerMarkupProps,
  type PdfLayerMarkup,
  type PdfMarkup,
} from '../hooks/pdf/use-markup';
import { useRegisterController } from '../hooks/use-controller-registry';
import type { DocViewerMark } from '../utils/markup';
import type { DocViewerMarkupOptions } from './markup-extension';

interface MarkupContextValue {
  markup: PdfMarkup;

  /** Whether the markup bar is open; it is also open while a tool is picked */
  opened: boolean;
  setOpened: (opened: boolean) => void;

  /** Writes the marks into the PDF and hands the bytes on */
  save: () => Promise<void>;
}

interface MarkupLayerContextValue {
  store: DocViewerStore;
  layer: PdfLayerMarkup;
  marksByPage: ReadonlyMap<number, DocViewerMark[]>;
}

const MarkupContext = createContext<MarkupContextValue | null>(null);
const MarkupLayerContext = createContext<MarkupLayerContextValue | null>(null);

/** The markup of the viewer, null without the markup extension or outside a PDF */
export function useMarkupContext() {
  return use(MarkupContext);
}

/** What the page layers draw with: the same value while the tool, settings and marks are */
export function useMarkupLayerContext() {
  return use(MarkupLayerContext);
}

function getMarkupProps(options: DocViewerMarkupOptions): DocViewerMarkupProps {
  return {
    withMarkup: true,
    markupTools: options.tools,
    markupTool: options.tool,
    defaultMarkupTool: options.defaultTool,
    onMarkupToolChange: options.onToolChange,
    markup: options.value,
    defaultMarkup: options.defaultValue,
    onMarkupChange: options.onChange,
    markupColor: options.color,
    markupWidth: options.width,
    markupFontSize: options.fontSize,
  };
}

/**
 * The markup's setup inside the PDF session: the markup state, the actions of the registry, the
 * tool in the store, and the contexts the bar, the button and the page layers read
 */
export function MarkupSetup({ children }: { children: React.ReactNode }) {
  const { store, controller, labels, fileName } = useDocViewerContext();
  const session = usePdfSession()!;
  const options = useDocViewerExtensionOptions<DocViewerMarkupOptions>('markup')!;
  const { announce, scrollToPage } = session.position;
  const markup = useMarkup(getMarkupProps(options), announce, scrollToPage);
  const [opened, setOpened] = useState(false);

  const save = useCallbackRef(async () => {
    const document = session.loaded.document;
    if (!document || markup.marks.length === 0) {
      return;
    }
    const bytes = await markup.save(document);
    const pages = [...new Set(markup.marks.map((mark) => mark.page))].sort((a, b) => a - b);
    await getSaveHandler({ editor: undefined, markup: options, fileName })?.(bytes, {
      reason: 'annotate',
      pages,
    });
    announce(labels.markupSavedLabel);
  });
  useRegisterController(controller, { setMarkupTool: markup.setTool, saveMarkup: save });

  useIsomorphicEffect(() => {
    store.getState().markupTool !== markup.tool &&
      updateDocViewerStateAction({ markupTool: markup.tool }, store);
  }, [store, markup.tool]);

  const { layer, marksByPage } = markup;
  const layerValue = useMemo(() => ({ store, layer, marksByPage }), [store, layer, marksByPage]);
  const value = useMemo(() => ({ markup, opened, setOpened, save }), [markup, opened, save]);

  return (
    <MarkupContext value={value}>
      <MarkupLayerContext value={layerValue}>{children}</MarkupLayerContext>
    </MarkupContext>
  );
}
