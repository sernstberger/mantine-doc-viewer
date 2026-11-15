import React from 'react';
import type { DocViewerType } from '../utils/get-doc-viewer-type';
import { useDocViewerContext } from '../doc-viewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar/ToolbarView';
import { DocViewerMessage } from '../DocViewerMessage/MessageView';

export function UnsupportedView({ type }: { type: DocViewerType }) {
  const { getStyles, labels } = useDocViewerContext();

  return (
    <>
      <DocViewerToolbar />
      <div {...getStyles('body')}>
        <DocViewerMessage withDownload>
          {type === 'unknown' ? labels.unsupportedLabel : labels.notSupportedYetLabel(type)}
        </DocViewerMessage>
      </div>
    </>
  );
}
