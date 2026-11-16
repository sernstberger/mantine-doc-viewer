import React from 'react';
import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import type { DocViewerControlProps } from '../../doc-viewer.types';
import { DocViewerTooltip, useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import { MarkupIcon } from '../markup-icons';
import classes from '../../DocViewer.module.css';
import { useMarkupContext } from '../markup-setup';

export type DocViewerMarkupButtonStylesNames = 'control';

export interface DocViewerMarkupButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerMarkupButtonFactory> {}

export type DocViewerMarkupButtonFactory = Factory<{
  props: DocViewerMarkupButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerMarkupButtonStylesNames;
  compound: true;
}>;

/**
 * Opens and closes the markup bar; closing it puts the tool down. For a custom toolbar
 * (control key `markup`), shown once a PDF with the markup extension is loaded
 */
export const DocViewerMarkupButton = factory<DocViewerMarkupButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, onClick, ...others } = useProps(
    'DocViewerMarkupButton',
    null,
    _props
  );
  const { getStyles } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const context = useMarkupContext();
  if (!context?.ready || !show('markup')) {
    return null;
  }

  const { markup, labels, opened, setOpened } = context;
  const barOpened = opened || markup.tool !== null;
  return (
    <DocViewerTooltip label={labels.markupLabel}>
      <ActionIcon
        {...controlProps(barOpened)}
        {...getStyles('control', { className, style, classNames, styles })}
        aria-label={labels.markupLabel}
        aria-pressed={barOpened}
        {...others}
        onClick={(event) => {
          onClick?.(event);
          setOpened(!barOpened);
          barOpened && markup.setTool(null);
        }}
      >
        <MarkupIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerMarkupButton.classes = classes;
DocViewerMarkupButton.displayName = 'mantine-doc-viewer/DocViewerMarkupButton';
