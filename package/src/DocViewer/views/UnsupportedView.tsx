import React from 'react';
import type { DocType } from '../detect-doc-type';
import { useDocViewerContext } from '../DocViewer.context';
import { DocViewerToolbar } from '../DocViewerToolbar';
import { DocViewerMessage } from './MessageView';

export function UnsupportedView({ type }: { type: DocType }) {
  const { getStyles } = useDocViewerContext();

  return (
    <>
      <DocViewerToolbar />
      <div {...getStyles('body')}>
        <DocViewerMessage withDownload>
          {type === 'unknown'
            ? 'Preview is not available for this file type'
            : `Preview for ${type} files is not available yet`}
        </DocViewerMessage>
      </div>
    </>
  );
}
