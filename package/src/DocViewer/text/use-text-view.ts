import { useEffect } from 'react';
import { useRegisterController } from '../controller';
import type { DocType } from '../detect-doc-type';
import { useDocViewerContext } from '../DocViewer.context';
import type { TextDocumentState } from './use-text-document';

/** Load events and the print action shared by the text, code and markdown views */
export function useTextView(type: DocType, state: TextDocumentState, print: () => Promise<void>) {
  const { controller, events, mimeType } = useDocViewerContext();

  useEffect(() => {
    if (state.status === 'ready') {
      events.onDocumentLoad({
        type,
        byteSize: state.size,
        mimeType: mimeType ?? state.mimeType,
      });
    } else if (state.status === 'error') {
      events.onDocumentError(state.error);
    } else if (state.status === 'too-large') {
      events.onDocumentError(new Error(`File is larger than maxTextSize: ${state.size} bytes`));
    }
  }, [state, type, events, mimeType]);

  useRegisterController(controller, { print, isPrintable: () => state.status === 'ready' });

  return state.status === 'ready' ? print : undefined;
}
