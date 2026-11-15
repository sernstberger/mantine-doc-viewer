import {
  ActionIcon,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { WrapIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerWrapButtonStylesNames = 'control';

export interface DocViewerWrapButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerWrapButtonFactory>, ElementProps<'button'> {}

export type DocViewerWrapButtonFactory = Factory<{
  props: DocViewerWrapButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerWrapButtonStylesNames;
  compound: true;
}>;

const TEXT_ONLY = ['text'] as const;

/** Wraps long lines of text files, or shows them on one line */
export const DocViewerWrapButton = factory<DocViewerWrapButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerWrapButton',
    null,
    _props
  );
  const { store, labels } = useDocViewerContext();
  const ready = useReadyDocument(TEXT_ONLY);
  const wrap = useDocViewerState(store, (state) => state.textWrap);
  const show = useShowControl();
  const controlProps = useControlProps();

  if (!ready || !show('wrap')) {
    return null;
  }

  return (
    <DocViewerTooltip label={wrap ? labels.doNotWrapLinesLabel : labels.wrapLinesLabel}>
      <ActionIcon
        {...controlProps(wrap, { className, style, classNames, styles })}
        aria-label={labels.wrapLinesLabel}
        aria-pressed={wrap}
        onClick={() => docViewerActions.updateState({ textWrap: !wrap }, store)}
        {...others}
      >
        <WrapIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerWrapButton.classes = classes;
DocViewerWrapButton.displayName = 'mantine-doc-viewer/DocViewerWrapButton';
