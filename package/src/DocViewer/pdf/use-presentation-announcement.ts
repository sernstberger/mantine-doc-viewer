import { useEffect } from 'react';
import { useDocViewerContext } from '../DocViewer.context';

/** Says that a presentation started and how to leave it, as the toolbar goes away with it */
export function usePresentationAnnouncement(
  presenting: boolean,
  announce: (message: string) => void
) {
  const { labels } = useDocViewerContext();

  useEffect(() => {
    presenting && announce(labels.presentationStarted);
    // Only when a presentation starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenting]);
}
