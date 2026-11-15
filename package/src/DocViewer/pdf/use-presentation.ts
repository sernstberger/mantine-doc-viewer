import { useEffect, useRef, useState } from 'react';

interface PresentationInput {
  /** Whether the viewer is full screen */
  fullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
  body: HTMLElement | null;
}

/**
 * Presentation mode: full screen when the browser allows it, and over when full screen ends
 * (Escape in most browsers). Where full screen is not available it presents inside the viewer
 */
export function usePresentation({ fullscreen, toggleFullscreen, body }: PresentationInput) {
  const [presenting, setPresenting] = useState(false);
  const enteredFullscreen = useRef(false);

  const start = async () => {
    setPresenting(true);
    if (!fullscreen && document.fullscreenEnabled) {
      await toggleFullscreen().then(
        () => {
          enteredFullscreen.current = true;
        },
        () => {}
      );
    }
  };

  const stop = async () => {
    setPresenting(false);
    if (enteredFullscreen.current) {
      enteredFullscreen.current = false;
      document.fullscreenElement && (await toggleFullscreen().catch(() => {}));
    }
  };

  // Leaving full screen (Escape, or the browser's own controls) ends the presentation
  useEffect(() => {
    if (!fullscreen && enteredFullscreen.current) {
      enteredFullscreen.current = false;
      setPresenting(false);
    }
  }, [fullscreen]);

  // Keys go to the presentation as soon as it starts
  useEffect(() => {
    presenting && body?.focus();
  }, [presenting, body]);

  return { presenting, start, stop, toggle: () => (presenting ? stop() : start()) };
}
