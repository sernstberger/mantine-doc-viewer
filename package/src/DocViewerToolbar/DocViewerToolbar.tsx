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
import { DocViewerProvider, useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerControl } from '../doc-viewer.types';
import classes from '../DocViewer.module.css';
import { ToolbarView } from './ToolbarView';

export type DocViewerToolbarStylesNames = 'toolbar' | 'toolbarSection' | 'controls';

export interface DocViewerToolbarProps
  extends BoxProps, CompoundStylesApiProps<DocViewerToolbarFactory>, ElementProps<'div', 'title'> {
  /** Toolbar content; without children the default controls for the document type are rendered */
  children?: React.ReactNode;

  /** Default controls to hide (ignored with children) */
  controls?: Partial<Record<DocViewerControl, boolean>>;

  /** Content before the title, for example a menu button */
  leftSection?: React.ReactNode;

  /** Content after the document controls, before print, download and full screen */
  rightSection?: React.ReactNode;

  /** Replaces the file name in the default title */
  title?: React.ReactNode;

  /** Small text under the title */
  subtitle?: React.ReactNode;

  /** Tapping the document with a finger hides and shows the toolbar, `false` by default */
  toggleOnTap?: boolean;

  /** Props passed to the tooltip of every control inside the toolbar */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;
}

export type DocViewerToolbarFactory = Factory<{
  props: DocViewerToolbarProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerToolbarStylesNames;
  compound: true;
}>;

/** The bar above the document: title, document controls, print, download and full screen */
export const DocViewerToolbar = factory<DocViewerToolbarFactory>((_props) => {
  const { children, controls, leftSection, rightSection, title, subtitle, tooltipProps } = useProps(
    'DocViewerToolbar',
    null,
    _props
  );
  const ctx = useDocViewerContext();
  const value = {
    ...ctx,
    withToolbar: true,
    toolbarControls: controls,
    toolbarStartSection: leftSection,
    toolbarSection: rightSection,
    toolbarTitle: title,
    toolbarSubtitle: subtitle,
    tooltipProps,
  };

  return (
    <DocViewerProvider value={value}>
      <ToolbarView onPrint={() => ctx.controller.current.print?.()}>{children}</ToolbarView>
    </DocViewerProvider>
  );
});

DocViewerToolbar.classes = classes;
DocViewerToolbar.displayName = 'mantine-doc-viewer/DocViewerToolbar';
