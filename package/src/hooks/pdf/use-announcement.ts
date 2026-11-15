import { useCallback, useState } from 'react';

/**
 * Text for a status region. Saying the same thing twice changes nothing in the DOM, so screen
 * readers would stay silent; an invisible character is alternated to make it change
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback(
    (text: string) => setAnnouncement((current) => text + (current.endsWith('​') ? '' : '​')),
    []
  );
  return [announcement, announce] as const;
}
