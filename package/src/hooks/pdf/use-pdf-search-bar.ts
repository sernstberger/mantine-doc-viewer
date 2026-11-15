import { useDebouncedValue } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useRef, useState } from 'react';
import type { SearchOptions } from '../../utils/search';
import { usePdfSearch } from './use-pdf-search';

/** Search bar state: opened, query and options, with focus moved into and out of the bar */
export function usePdfSearchBar(
  document: PDFDocumentProxy | null,
  /** Where focus goes when search closes and the search button is hidden */
  fallbackFocus?: HTMLElement | null
) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>({});
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const search = usePdfSearch(document, opened ? debouncedQuery : '', options);

  const open = (nextQuery?: string) => {
    nextQuery !== undefined && setQuery(nextQuery);
    setOpened(true);
    // Focus after the search bar has rendered
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const close = () => {
    setOpened(false);
    setQuery('');
    // The search bar held focus, so return it to the button that opens search
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
