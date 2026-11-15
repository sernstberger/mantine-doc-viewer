import { useCallback, useEffect, useRef } from 'react';
import { focusIfLost } from '../../utils/a11y';

/**
 * Focus back on a toolbar button after a mode it opened ends. The page editor and presentations
 * replace the toolbar, so the button that started them is gone and focus falls to the page body;
 * when the mode ends the button comes back (after a reload, perhaps) and takes focus again.
 * The same when the toolbar goes for a while with the focused button, as it does while a document
 * reloads. Focus the reader moved somewhere else in the meantime stays there. Attach the returned
 * ref to the button
 */
export function useReturnFocus(active: boolean) {
  const button = useRef<HTMLElement | null>(null);
  const pending = useRef(false);
  const wasActive = useRef(active);

  const restore = useCallback(() => {
    if (pending.current && button.current) {
      pending.current = false;
      focusIfLost(button.current);
    }
  }, []);

  useEffect(() => {
    pending.current = wasActive.current && !active;
    wasActive.current = active;
    restore();
  }, [active, restore]);

  return useCallback(
    (node: HTMLElement | null) => {
      // A focused button that goes with the toolbar (while a document reloads) takes focus back
      if (!node && button.current === document.activeElement) {
        pending.current = true;
      }
      button.current = node;
      restore();
    },
    [restore]
  );
}
