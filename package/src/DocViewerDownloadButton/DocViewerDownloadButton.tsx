import { ActionIcon, CompoundStylesApiProps, factory, Factory, useProps } from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerLinkControlProps } from '../doc-viewer.types';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { DownloadIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerDownloadButtonStylesNames = 'control';

export interface DocViewerDownloadButtonProps
  extends DocViewerLinkControlProps, CompoundStylesApiProps<DocViewerDownloadButtonFactory> {}

export type DocViewerDownloadButtonFactory = Factory<{
  props: DocViewerDownloadButtonProps;
  ref: HTMLAnchorElement;
  stylesNames: DocViewerDownloadButtonStylesNames;
  compound: true;
}>;

/** Downloads the document */
export const DocViewerDownloadButton = factory<DocViewerDownloadButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerDownloadButton',
    null,
    _props
  );
  const { src, fileName, labels } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();

  if (!show('download')) {
    return null;
  }

  return (
    <DocViewerTooltip label={labels.downloadLabel}>
      <ActionIcon
        component="a"
        href={src}
        download={fileName ?? true}
        target="_blank"
        rel="noopener noreferrer"
        {...controlProps(false, { className, style, classNames, styles })}
        aria-label={labels.downloadLabel}
        {...others}
      >
        <DownloadIcon />
      </ActionIcon>
    </DocViewerTooltip>
  );
});

DocViewerDownloadButton.classes = classes;
DocViewerDownloadButton.displayName = 'mantine-doc-viewer/DocViewerDownloadButton';
