import { memo } from 'react';
import type { DocViewerPageLayerProps } from '../../doc-viewer.types';
import { useDocViewerState } from '../../hooks/use-doc-viewer-state';
import type { PdfLayerMarkup } from '../hooks/use-markup';
import { useMarkupLayerContext } from '../markup-setup';
import type { DocViewerMark } from '../utils/markup';
import { NO_MARKS } from '../utils/marks-by-page';
import { MarkupLayer } from './MarkupLayer';
import { MarkList } from './MarkupText';

interface MarkupPageLayerViewProps extends DocViewerPageLayerProps {
  layer: PdfLayerMarkup;
  marks: DocViewerMark[];
  tabStop: boolean;
}

/** Memoised: a new mark renders only the layer of the page it is on */
const MarkupPageLayerView = memo(function MarkupPageLayerView({
  page,
  numPages,
  near,
  layer,
  marks,
  tabStop,
  ...layerSize
}: MarkupPageLayerViewProps) {
  return (
    <>
      {marks.length > 0 && <MarkList pageNumber={page} marks={marks} labels={layer.labels} />}
      {near && (
        <MarkupLayer
          pageNumber={page}
          numPages={numPages}
          tabStop={tabStop}
          markup={layer}
          marks={marks}
          {...layerSize}
        />
      )}
    </>
  );
});

/**
 * The marks of a page and, near the view, the layer that draws new ones. The current page's layer
 * is the Tab stop while a tool is picked. Pages render only inside the session, under the setup
 */
export function MarkupPageLayer(props: DocViewerPageLayerProps) {
  const { store, layer, marksByPage } = useMarkupLayerContext()!;
  const tabStop = useDocViewerState(
    store,
    (state) => layer.tool !== null && state.page === props.page
  );

  return (
    <MarkupPageLayerView
      {...props}
      layer={layer}
      marks={marksByPage.get(props.page) ?? NO_MARKS}
      tabStop={tabStop}
    />
  );
}
