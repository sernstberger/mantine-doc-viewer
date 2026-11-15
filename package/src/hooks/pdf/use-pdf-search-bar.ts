import { useDebouncedValue } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useRef, useState } from 'react';
import type { DocViewerStore } from '../../doc-viewer.store';
import type { SearchOptions } from '../../utils/search';
import { useDocViewerStateValue } from '../use-doc-viewer-state';
import { usePdfSearch } from './use-pdf-search';

/** Search bar state: opened, query and options, with focus moved into and out of the bar */
export function usePdfSearchBar(
  store: DocViewerStore,
  document: PDFDocumentProxy | null,
  /** Where focus goes when search closes and the search button is hidden */
  fallbackFocus?: HTMLElement | null
) {
  const [opened, setOpened] = useDocViewerStateValue(store, 'searchOpened');
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>({});
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const search = usePdfSearch(document, opened ? debouncedQuery : '', options);

  const open = (nextQuery?: string) => {
    nextQuery !== undefined && setQuery(nextQuery);
    setOpened(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const close = () => {
    setOpened(false);
    setQuery('');
    requestAnimationFrame(() => (toggleRef.current ?? fallbackFocus)?.focus());
  };

  return {
    ...search,
    opened,
    query,
    setQuery,
    options,
    setOptions,
    searching: search.searching || query !== debouncedQuery,
    activeMatch: search.matches[search.activeIndex],
    inputRef,
    toggleRef,
    open,
    close,
  };
}
