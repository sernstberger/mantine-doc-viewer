import { ActionIcon } from '@mantine/core';
import React, { useState } from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { DocViewerToolbar } from '../DocViewerToolbar/ToolbarView';
import { MarkupIcon } from '../utils/icons';
import { PdfMarkupBar } from '../DocViewerMarkup/PdfMarkupBar';
import { PdfSearchBar } from '../DocViewerSearch/PdfSearchBar';
import type { PdfMarkup } from '../hooks/pdf/use-markup';
import type { usePdfSearchBar } from '../hooks/pdf/use-pdf-search-bar';

interface PdfBarsProps {
  /** False while the PDF loads: the toolbar shows without the PDF's controls and bars */
  ready: boolean;
  /** The PDF's toolbar controls */
  controls: React.ReactNode;
  onPrint: () => Promise<void>;
  markup: PdfMarkup;
  onSaveMarkup: () => Promise<void>;
  search: ReturnType<typeof usePdfSearchBar>;
}

/** The toolbar above a PDF, with the markup toggle, and the markup and search bars below it */
export function PdfBars({ ready, controls, onPrint, markup, onSaveMarkup, search }: PdfBarsProps) {
  const { labels, markup: markupProps } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const [markupOpened, setMarkupOpened] = useState(false);
  // The bar is open while it was opened, and while a tool is picked (also from the app)
  const markupBar = !!markupProps.withMarkup && (markupOpened || markup.tool !== null);

  if (!ready) {
    return <DocViewerToolbar />;
  }

  return (
    <>
      <DocViewerToolbar onPrint={onPrint}>
        {controls}
        {markupProps.withMarkup && show('markup') && (
          <DocViewerTooltip label={labels.markup}>
            <ActionIcon
              {...controlProps(markupBar)}
              aria-label={labels.markup}
              aria-pressed={markupBar}
              onClick={() => {
                setMarkupOpened(!markupBar);
                markupBar && markup.setTool(null);
              }}
            >
              <MarkupIcon />
            </ActionIcon>
          </DocViewerTooltip>
        )}
      </DocViewerToolbar>

      {markupBar && (
        <PdfMarkupBar
          markup={markup}
          onSave={() =>
            onSaveMarkup().catch((error: Error) => {
              // eslint-disable-next-line no-console
              console.error(error);
            })
          }
          onClose={() => {
            setMarkupOpened(false);
            markup.setTool(null);
          }}
        />
      )}

      {search.opened && (
        <PdfSearchBar
          inputRef={search.inputRef}
          query={search.query}
          onQueryChange={search.setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          activePage={search.activeMatch?.pageNumber}
          searching={search.searching}
          onNext={search.next}
          onPrevious={search.previous}
          onClose={search.close}
          options={search.options}
          onOptionsChange={search.setOptions}
        />
      )}
    </>
  );
}
