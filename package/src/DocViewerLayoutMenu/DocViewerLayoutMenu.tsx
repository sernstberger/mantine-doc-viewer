import {
  ActionIcon,
  CompoundStylesApiProps,
  factory,
  Factory,
  Popover,
  Radio,
  Stack,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import type { DocViewerControlProps, DocViewerPageLayout } from '../doc-viewer.types';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_ONLY, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { TwoPagesIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerLayoutMenuStylesNames = 'control' | 'dropdown';

export interface DocViewerLayoutMenuProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerLayoutMenuFactory> {
  /** Layouts in the menu @default all layouts */
  layouts?: DocViewerPageLayout[];
}

export type DocViewerLayoutMenuFactory = Factory<{
  props: DocViewerLayoutMenuProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerLayoutMenuStylesNames;
  compound: true;
}>;

const LAYOUTS = [
  ['single', 'layoutSingleLabel'],
  ['two-page', 'layoutTwoPageLabel'],
  ['two-page-cover', 'layoutTwoPageCoverLabel'],
  ['horizontal', 'layoutHorizontalLabel'],
  ['wrapped', 'layoutWrappedLabel'],
] as const;

/** Menu of PDF page layouts */
export const DocViewerLayoutMenu = factory<DocViewerLayoutMenuFactory>((_props) => {
  const { classNames, className, style, styles, vars, layouts, ...others } = useProps(
    'DocViewerLayoutMenu',
    null,
    _props
  );
  const { store, getStyles, labels, size, unstyled } = useDocViewerContext();
  const ready = useReadyDocument(PDF_ONLY);
  const layout = useDocViewerState(store, (state) => state.pageLayout);
  const show = useShowControl();
  const controlProps = useControlProps();
  const stylesApiProps = { classNames, styles };

  if (!ready || !show('layout')) {
    return null;
  }

  return (
    <Popover
      unstyled={unstyled}
      position="bottom-end"
      shadow="md"
      withinPortal={false}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <DocViewerTooltip label={labels.pageLayoutLabel}>
          <ActionIcon
            {...controlProps(layout !== 'single', { className, style, classNames, styles })}
            aria-label={labels.pageLayoutLabel}
            {...others}
          >
            <TwoPagesIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown {...getStyles('dropdown', stylesApiProps)}>
        <Radio.Group
          value={layout}
          onChange={(value) => docViewerActions.setPageLayout(value as DocViewerPageLayout, store)}
          label={labels.pageLayoutLabel}
          size={size.input}
        >
          <Stack gap={6} mt={6}>
            {LAYOUTS.filter(([value]) => !layouts || layouts.includes(value)).map(
              ([value, label]) => (
                <Radio
                  key={value}
                  unstyled={unstyled}
                  value={value}
                  label={labels[label]}
                  size={size.input}
                />
              )
            )}
          </Stack>
        </Radio.Group>
      </Popover.Dropdown>
    </Popover>
  );
});

DocViewerLayoutMenu.classes = classes;
DocViewerLayoutMenu.displayName = 'mantine-doc-viewer/DocViewerLayoutMenu';
