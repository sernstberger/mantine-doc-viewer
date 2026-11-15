import { useEffect } from 'react';
import { useDocViewerContext } from '../../doc-viewer.context';
import { useReturnFocus } from './use-return-focus';

/**
 * Presentations, which replace the toolbar: the ref of the button that takes focus back when one
 * ends, and saying that a presentation started
 */
export function usePdfModes(presenting: boolean, announce: (message: string) => void) {
  const { labels } = useDocViewerContext();

  useEffect(() => {
    presenting && announce(labels.presentationStartedLabel);
    // Only when a presentation starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenting]);

  return { presentRef: useReturnFocus(presenting) };
}

export type PdfModes = ReturnType<typeof usePdfModes>;
