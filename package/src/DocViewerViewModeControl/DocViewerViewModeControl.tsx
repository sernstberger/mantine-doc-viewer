import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  SegmentedControl,
  useProps,
} from '@mantine/core';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import classes from '../DocViewer.module.css';

export type DocViewerViewModeControlStylesNames = 'viewMode';

export interface DocViewerViewModeControlProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerViewModeControlFactory>,
    ElementProps<'div', 'onChange' | 'defaultValue'> {}

export type DocViewerViewModeControlFactory = Factory<{
  props: DocViewerViewModeControlProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerViewModeControlStylesNames;
  compound: true;
}>;

const MARKDOWN_AND_CODE = ['markdown', 'code'] as const;

/** Switches markdown and JSON files between their preview (the tree for JSON) and their source */
export const DocViewerViewModeControl = factory<DocViewerViewModeControlFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerViewModeControl',
    null,
    _props
  );
  const { store, getStyles, labels, size } = useDocViewerContext();
  const ready = useReadyDocument(MARKDOWN_AND_CODE);
  const available = useDocViewerState(store, (state) => state.viewModeAvailable);
  const markdown = useDocViewerState(store, (state) => state.type === 'markdown');
  const mode = useDocViewerState(store, (state) => state.viewMode);
  const show = useShowControl();

  if (!ready || !available || !show('viewMode')) {
    return null;
  }

  return (
    <SegmentedControl
      size={size.input}
      value={mode}
      onChange={(value) =>
        docViewerActions.updateState({ viewMode: value as 'preview' | 'source' }, store)
      }
      data={[
        { value: 'preview', label: markdown ? labels.previewLabel : labels.treeLabel },
        { value: 'source', label: markdown ? labels.sourceLabel : labels.codeLabel },
      ]}
      aria-label={markdown ? labels.markdownViewLabel : labels.jsonViewLabel}
      {...getStyles('viewMode', { className, style, classNames, styles })}
      {...others}
    />
  );
});

DocViewerViewModeControl.classes = classes;
DocViewerViewModeControl.displayName = 'mantine-doc-viewer/DocViewerViewModeControl';
