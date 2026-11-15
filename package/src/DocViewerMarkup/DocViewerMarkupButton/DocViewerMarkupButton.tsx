import React from 'react';
import {
  ActionIcon,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import { useReadyPdfSession } from '../../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import { MarkupIcon } from '../../utils/icons';
import classes from '../../DocViewer.module.css';
import { useMarkupContext } from '../markup-setup';

export type DocViewerMarkupButtonStylesNames = 'control';

export interface DocViewerMarkupButtonProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkupButtonFactory>, ElementProps<'button'> {}

export type DocViewerMarkupButtonFactory = Factory<{
  props: DocViewerMarkupButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerMarkupButtonStylesNames;
  compound: true;
}>;

/** Opens and closes the markup tools, for a custom toolbar (control key `markup`) */
export const DocViewerMarkupButton = factory<DocViewerMarkupButtonFactory>((_props) => {
  useProps('DocViewerMarkupButton', null, _props);
  const { labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const session = useReadyPdfSession();
  const context = useMarkupContext();
  if (!session || !context || !show('markup')) {
    return null;
  }

  const { markup, opened, setOpened } = context;
  const barOpened = opened || markup.tool !== null;
  return (
    <DocViewerTooltip label={labels.markupLabel}>
      <ActionIcon
        {...controlProps(barOpened)}
        aria-label={labels.markupLabel}
        aria-pressed={barOpened}
        onClick={() => {
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
