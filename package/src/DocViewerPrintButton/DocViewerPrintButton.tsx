import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import React, { useState } from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PrintIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerPrintButtonStylesNames = 'control';

export interface DocViewerPrintButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerPrintButtonFactory> {}

export type DocViewerPrintButtonFactory = Factory<{
  props: DocViewerPrintButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerPrintButtonStylesNames;
  compound: true;
}>;

/** Prints the document, renders nothing until the document is loaded and can be printed */
export const DocViewerPrintButton = factory<DocViewerPrintButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, onClick, ...others } = useProps(
    'DocViewerPrintButton',
    null,
    _props
  );
  const { store, src, labels } = useDocViewerContext();
  const canPrint = useDocViewerState(store, (state) => state.canPrint);
  const show = useShowControl();
  const controlProps = useControlProps();
  const [printing, setPrinting] = useState(false);

  if (!canPrint || !show('print')) {
    return null;
  }

  const print = async () => {
    setPrinting(true);
    try {
      await docViewerActions.print(store);
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <DocViewerTooltip label={labels.printLabel}>
      <ActionIcon
        {...controlProps(false, { className, style, classNames, styles })}
        aria-label={labels.printLabel}
        loading={printing}
        {...others}
        onClick={(event) => {
          print();
          onClick?.(event);
        }}
      >
        <PrintIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerPrintButton.classes = classes;
DocViewerPrintButton.displayName = 'mantine-doc-viewer/DocViewerPrintButton';
