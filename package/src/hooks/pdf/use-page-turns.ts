import { useState } from 'react';
import { turnPages } from '../../utils/page-selection';

/** Quarter turns per page, clockwise in degrees, written into the PDF when it is saved */
export function usePageTurns() {
  const [rotations, setRotations] = useState<Record<number, number>>({});

  return {
    turnOf: (page: number) => rotations[page] ?? 0,
    /** Turn these pages another quarter clockwise */
    turn: (pages: Iterable<number>) => setRotations((current) => turnPages(current, pages)),
    clearTurns: () => setRotations({}),
  };
}
