import React from 'react';
import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  TooltipProps,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerSearchInputProps } from '../doc-viewer.types';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import classes from '../DocViewer.module.css';
import { PdfSearchBar } from './PdfSearchBar';

export type DocViewerSearchStylesNames =
  | 'search'
  | 'searchInput'
  | 'searchCount'
  | 'searchOption'
  | 'control';

export interface DocViewerSearchProps
  extends BoxProps, CompoundStylesApiProps<DocViewerSearchFactory>, ElementProps<'div'> {
  /** Props passed to the search box, for example `{ placeholder: 'Find in contract' }` */
  inputProps?: DocViewerSearchInputProps;

  /** Props passed to the tooltip of every button in the search bar */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;
}

export type DocViewerSearchFactory = Factory<{
  props: DocViewerSearchProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerSearchStylesNames;
  compound: true;
}>;

/** The PDF search bar, shown while search is open */
export const DocViewerSearch = factory<DocViewerSearchFactory>((_props) => {
  useProps('DocViewerSearch', null, _props);
  useDocViewerContext();
  const session = useReadyPdfSession();
  const search = session?.content.search;
  if (!search?.opened) {
    return null;
  }

  return (
    <PdfSearchBar
      inputRef={search.inputRef}
      query={search.query}
      onQueryChange={search.setQuery}
      matchCount={search.matches.length}
      activeIndex={search.activeIndex}
      activePage={search.activeMatch?.pageNumber}
      searching={search.searching}
      onNext={search.next}
      onPrevious={search.previous}
      onClose={search.close}
      options={search.options}
      onOptionsChange={search.setOptions}
    />
  );
});

DocViewerSearch.classes = classes;
DocViewerSearch.displayName = 'mantine-doc-viewer/DocViewerSearch';
