import React, { use, useMemo } from 'react';
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
import { PartStyles } from '../DocViewerPages/PartStyles';
import type { DocViewerSearchInputProps } from '../doc-viewer.types';
import { DocViewerToolbarContext } from '../DocViewerToolbar/toolbar-context';
import { DocViewerLayoutContext, mergePartProps } from '../DocViewerRoot/layout-context';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
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

/** The search bar, with the tooltips of its buttons set from `tooltipProps` */
function SearchBar({
  inputProps,
  tooltipProps,
  classNames,
  className,
  style,
  styles,
  vars,
  ref,
  ...others
}: DocViewerSearchProps) {
  const session = usePdfSession();
  const stylesOptions = useShallowStable({ className, style });
  const elementProps = useShallowStable(others);
  const toolbar = useMemo(() => ({ tooltipProps }), [tooltipProps]);
  const search = session?.content.search;
  if (!search) {
    return null;
  }

  return (
    <PartStyles classNames={classNames} styles={styles}>
      <DocViewerToolbarContext value={toolbar}>
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
          inputProps={inputProps}
          stylesOptions={stylesOptions}
          elementProps={elementProps}
          rootRef={ref}
        />
      </DocViewerToolbarContext>
    </PartStyles>
  );
}

/** The PDF search bar, shown while search is open */
export const DocViewerSearch = factory<DocViewerSearchFactory>((_props) => {
  const layout = use(DocViewerLayoutContext);
  const props = useProps('DocViewerSearch', null, mergePartProps(layout.searchProps, _props));
  const { store } = useDocViewerContext();
  const opened = useDocViewerState(store, (state) => state.searchOpened);
  return opened ? <SearchBar {...props} /> : null;
});

DocViewerSearch.classes = classes;
DocViewerSearch.displayName = 'mantine-doc-viewer/DocViewerSearch';
