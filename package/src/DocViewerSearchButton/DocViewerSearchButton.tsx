import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_ONLY, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { SearchIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerSearchButtonStylesNames = 'control';

export interface DocViewerSearchButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerSearchButtonFactory> {}

export type DocViewerSearchButtonFactory = Factory<{
  props: DocViewerSearchButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerSearchButtonStylesNames;
  compound: true;
}>;

/** Opens and closes the search of a PDF */
export const DocViewerSearchButton = factory<DocViewerSearchButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ref, onClick, ...others } = useProps(
    'DocViewerSearchButton',
    null,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const returnFocusRef = usePdfSession()?.content.search.toggleRef;
  const mergedRef = useMergedRef(ref, returnFocusRef);
  const ready = useReadyDocument(PDF_ONLY);
  const opened = useDocViewerState(store, (state) => state.searchOpened);
  const available = useDocViewerState(store, (state) => state.searchAvailable);
  const show = useShowControl();
  const controlProps = useControlProps();

  if (!ready || !available || !show('search')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.searchLabel}>
      <ActionIcon
        {...controlProps(opened, { className, style, classNames, styles })}
        ref={mergedRef}
        aria-label={labels.searchLabel}
        aria-pressed={opened}
        {...others}
        onClick={(event) => {
          if (opened) {
            docViewerActions.closeSearch(store);
          } else {
            docViewerActions.openSearch(undefined, store);
          }
          onClick?.(event);
        }}
      >
        <SearchIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerSearchButton.classes = classes;
DocViewerSearchButton.displayName = 'mantine-doc-viewer/DocViewerSearchButton';
