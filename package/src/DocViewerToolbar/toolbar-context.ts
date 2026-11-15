import type { TooltipProps } from '@mantine/core';
import { createContext, use } from 'react';

export interface DocViewerToolbarContextValue {
  /** Props of the tooltip of every control inside the toolbar */
  tooltipProps: Omit<TooltipProps, 'label' | 'children'> | undefined;
}

export const DocViewerToolbarContext = createContext<DocViewerToolbarContextValue | null>(null);

/** What the toolbar or overlay controls around a control share with it, null outside of them */
export function useDocViewerToolbarContext() {
  return use(DocViewerToolbarContext);
}
