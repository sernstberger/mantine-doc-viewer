import { useCallbackRef, useFullscreenElement } from '@mantine/hooks';
import { useEffect, useRef } from 'react';

/**
 * Full screen of the viewer element, which an app can also set with `value`. The browser decides:
 * it only allows full screen after a click or key press, and ends it on Escape. So `value` is
 * followed when it changes, and every real change, from the toolbar, the controller, the browser
 * or a refused request, is reported with `onChange` so the app can catch up
 */
export function useControlledFullscreen(
  value: boolean | undefined,
  onChange: ((fullscreen: boolean) => void) | undefined
) {
  const element = useFullscreenElement<HTMLDivElement>();
  const { fullscreen } = element;
  const report = useCallbackRef(onChange);
  const toggle = useCallbackRef(element.toggle);
  const reported = useRef(fullscreen);
  const current = useRef(fullscreen);
  current.current = fullscreen;

  useEffect(() => {
    if (reported.current !== fullscreen) {
      reported.current = fullscreen;
      report(fullscreen);
    }
  }, [fullscreen, report]);

  // Only when the app changes `value`: the browser leaving full screen must not enter it again
  useEffect(() => {
    if (value !== undefined && value !== current.current) {
      toggle().catch(() => report(current.current));
    }
  }, [value, toggle, report]);

  return element;
}
