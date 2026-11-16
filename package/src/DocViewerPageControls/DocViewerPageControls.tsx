import {
  ActionIcon,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  Box,
  Text,
  useProps,
  VisuallyHidden,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { PDF_ONLY, useReadyDocument } from '../DocViewerToolbar/use-ready-document';
import { toolbarSoftDisabled } from '../utils/a11y';
import { formatNumber } from '../utils/format';
import { ChevronDownIcon, ChevronUpIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerPageControlsStylesNames = 'pageControls' | 'pageIndicator' | 'control';

export interface DocViewerPageControlsProps
  extends BoxProps, CompoundStylesApiProps<DocViewerPageControlsFactory>, ElementProps<'div'> {}

export type DocViewerPageControlsFactory = Factory<{
  props: DocViewerPageControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPageControlsStylesNames;
  compound: true;
}>;

/** Previous and next page buttons around the page number of a PDF */
export const DocViewerPageControls = factory<DocViewerPageControlsFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerPageControls',
    null,
    _props
  );
  const { store, getStyles, labels, locale, unstyled } = useDocViewerContext();
  const ready = useReadyDocument(PDF_ONLY);
  const page = useDocViewerState(store, (state) => state.page);
  const numPages = useDocViewerState(store, (state) => state.numPages);
  const show = useShowControl();
  const controlProps = useControlProps();
  const stylesApiProps = { classNames, styles };
  const goToPage = (target: number) => docViewerActions.goToPage(target, undefined, store);

  if (!ready || !show('pages')) {
    return null;
  }

  return (
    <Box {...getStyles('pageControls', { className, style, classNames, styles })} {...others}>
      <DocViewerTooltip label={labels.previousPageLabel}>
        <ActionIcon
          {...controlProps(false, stylesApiProps)}
          aria-label={labels.previousPageLabel}
          {...toolbarSoftDisabled(page <= 1, () => goToPage(page - 1))}
        >
          <ChevronUpIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <Text
        unstyled={unstyled}
        {...getStyles('pageIndicator', stylesApiProps)}
        title={labels.pageOfLabel(page, numPages)}
      >
        <span aria-hidden>
          {formatNumber(page, locale)} / {formatNumber(numPages, locale)}
        </span>
        <VisuallyHidden>{labels.pageOfLabel(page, numPages)}</VisuallyHidden>
      </Text>
      <DocViewerTooltip label={labels.nextPageLabel}>
        <ActionIcon
          {...controlProps(false, stylesApiProps)}
          aria-label={labels.nextPageLabel}
          {...toolbarSoftDisabled(page >= numPages, () => goToPage(page + 1))}
        >
          <ChevronDownIcon />
        </ActionIcon>
      </DocViewerTooltip>
    </Box>
  );
});

DocViewerPageControls.classes = classes;
DocViewerPageControls.displayName = 'mantine-doc-viewer/DocViewerPageControls';
