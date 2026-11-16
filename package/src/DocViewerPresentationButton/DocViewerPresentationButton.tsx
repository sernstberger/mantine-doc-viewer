import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { usePdfSession } from '../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_ONLY, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { PresentationIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerPresentationButtonStylesNames = 'control';

export interface DocViewerPresentationButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerPresentationButtonFactory> {}

export type DocViewerPresentationButtonFactory = Factory<{
  props: DocViewerPresentationButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPresentationButtonStylesNames;
  compound: true;
}>;

/** Starts a presentation of a PDF: full screen, one page at a time */
export const DocViewerPresentationButton = factory<DocViewerPresentationButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ref, onClick, ...others } = useProps(
    'DocViewerPresentationButton',
    null,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const returnFocusRef = usePdfSession()?.modes.presentRef;
  const mergedRef = useMergedRef(ref, returnFocusRef);
  const ready = useReadyDocument(PDF_ONLY);
  const show = useShowControl();
  const controlProps = useControlProps();

  if (!ready || !show('presentation')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.enterPresentationLabel}>
      <ActionIcon
        {...controlProps(false, { className, style, classNames, styles })}
        ref={mergedRef}
        aria-label={labels.enterPresentationLabel}
        {...others}
        onClick={(event) => {
          docViewerActions.togglePresentation(store);
          onClick?.(event);
        }}
      >
        <PresentationIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerPresentationButton.classes = classes;
DocViewerPresentationButton.displayName = 'mantine-doc-viewer/DocViewerPresentationButton';
