import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_OR_IMAGE, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { RotateIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerRotateButtonStylesNames = 'control';

export interface DocViewerRotateButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerRotateButtonFactory> {}

export type DocViewerRotateButtonFactory = Factory<{
  props: DocViewerRotateButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerRotateButtonStylesNames;
  compound: true;
}>;

/** Turns the pages of a PDF, or an image, 90° clockwise */
export const DocViewerRotateButton = factory<DocViewerRotateButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, onClick, ...others } = useProps(
    'DocViewerRotateButton',
    null,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const ready = useReadyDocument(PDF_OR_IMAGE);
  const show = useShowControl();
  const controlProps = useControlProps();

  if (!ready || !show('rotate')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.rotateLabel}>
      <ActionIcon
        {...controlProps(false, { className, style, classNames, styles })}
        aria-label={labels.rotateLabel}
        {...others}
        onClick={(event) => {
          docViewerActions.rotate(store);
          onClick?.(event);
        }}
      >
        <RotateIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerRotateButton.classes = classes;
DocViewerRotateButton.displayName = 'mantine-doc-viewer/DocViewerRotateButton';
