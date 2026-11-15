import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  Toolbar,
  TooltipProps,
  useProps,
} from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerControl } from '../doc-viewer.types';
import { DocViewerTitle } from '../DocViewerTitle/DocViewerTitle';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import classes from '../DocViewer.module.css';
import { DefaultControls, DefaultEndControls } from './default-controls';
import { DocViewerToolbarContext } from './toolbar-context';
import { useToolbarTapToggle } from './use-toolbar-tap-toggle';

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

const defaultProps = {
  toggleOnTap: false,
} satisfies Partial<DocViewerToolbarProps>;

/** The bar above the document: the controls of its type by default, or the controls it is given. It is not shown while a PDF is presented */
export const DocViewerToolbar = factory<DocViewerToolbarFactory>((_props) => {
  const {
    classNames,
    className,
    style,
    styles,
    vars,
    children,
    controls,
    leftSection,
    rightSection,
    title,
    subtitle,
    toggleOnTap,
    tooltipProps,
    ref,
    ...others
  } = useProps('DocViewerToolbar', defaultProps, _props);
  const { store, getStyles, labels } = useDocViewerContext();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref, setElement);
  const hidden = useToolbarTapToggle(toggleOnTap, element);
  const presenting = useDocViewerState(store, (state) => state.presenting);
  const context = useMemo(() => ({ tooltipProps }), [tooltipProps]);
  const stylesApiProps = { classNames, styles };
  const withDefaults = children === undefined || children === null;

  if (presenting) {
    return null;
  }

  return (
    <DocViewerToolbarContext value={context}>
      <Box
        ref={mergedRef}
        {...getStyles('toolbar', { className, style, classNames, styles })}
        data-doc-viewer-toolbar
        data-hidden={hidden || undefined}
        {...others}
      >
        {leftSection && (
          <div {...getStyles('toolbarSection', stylesApiProps)} data-position="left">
            {leftSection}
          </div>
        )}
        {withDefaults && controls?.title !== false && (
          <DocViewerTitle title={title} subtitle={subtitle} />
        )}
        <Toolbar
          unstyled
          withBorder={false}
          aria-label={labels.toolbarLabel}
          {...getStyles('controls', stylesApiProps)}
        >
          {withDefaults ? <DefaultControls controls={controls} /> : children}
          {rightSection && (
            <div {...getStyles('toolbarSection', stylesApiProps)} data-position="right">
              {rightSection}
            </div>
          )}
          {withDefaults && <DefaultEndControls controls={controls} />}
        </Toolbar>
      </Box>
    </DocViewerToolbarContext>
  );
});

DocViewerToolbar.classes = classes;
DocViewerToolbar.displayName = 'mantine-doc-viewer/DocViewerToolbar';
