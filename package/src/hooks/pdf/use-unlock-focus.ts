import { useEffect, useRef } from 'react';
import { focusIfLost } from '../../utils/a11y';
import type { PdfDocumentState } from './use-pdf-document';

/**
 * Focus on the scroll area once a document the reader unlocked has loaded. The password form goes
 * with the focused field when it is submitted, which leaves focus on the page body
 */
export function useUnlockFocus(status: PdfDocumentState['status'], body: HTMLElement | null) {
  const previous = useRef(status);
  const unlocking = useRef(false);

  useEffect(() => {
    if (previous.current === 'password' && status === 'loading') {
      unlocking.current = true;
    }
    if (status === 'ready' && unlocking.current) {
      focusIfLost(body);
    }
    if (status !== 'loading') {
      unlocking.current = false;
    }
    previous.current = status;
  }, [status, body]);
}
