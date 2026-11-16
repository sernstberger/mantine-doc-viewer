import {
  ActionIcon,
  Box,
  BoxProps,
  CloseButton,
  ElementProps,
  type GetStylesApiOptions,
} from '@mantine/core';
import type { Ref } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { softDisabled } from '../utils/a11y';
import { formatNumber } from '../utils/format';
import { ChevronDownIcon, ChevronUpIcon } from '../utils/icons';

interface PdfPresentationControlsProps {
  currentPage: number;
  numPages: number;
  onGoToPage: (page: number) => void;
  onExit: () => void;

  /** className, style, classNames and styles of the `presentationControls` element */
  stylesOptions?: GetStylesApiOptions;

  /** Other props of the `presentationControls` element */
  elementProps?: BoxProps & ElementProps<'div'>;
  rootRef?: Ref<HTMLDivElement>;
}

/** The page count, the previous and next page buttons and the exit button over a presentation */
export function PdfPresentationControls({
  currentPage,
  numPages,
  onGoToPage,
  onExit,
  stylesOptions,
  elementProps,
  rootRef,
}: PdfPresentationControlsProps) {
  const { getStyles, labels, locale, unstyled } = useDocViewerContext();
  return (
    <Box ref={rootRef} {...getStyles('presentationControls', stylesOptions)} {...elementProps}>
      <ActionIcon
        {...getStyles('control')}
        unstyled={unstyled}
        size="md"
        variant="transparent"
        aria-label={labels.previousPageLabel}
        {...softDisabled(currentPage <= 1, () => onGoToPage(currentPage - 1))}
      >
        <ChevronUpIcon />
      </ActionIcon>
      <span {...getStyles('pageIndicator')}>
        {formatNumber(currentPage, locale)} / {formatNumber(numPages, locale)}
      </span>
      <ActionIcon
        {...getStyles('control')}
        unstyled={unstyled}
        size="md"
        variant="transparent"
        aria-label={labels.nextPageLabel}
        {...softDisabled(currentPage >= numPages, () => onGoToPage(currentPage + 1))}
      >
        <ChevronDownIcon />
      </ActionIcon>
      <CloseButton
        {...getStyles('control')}
        unstyled={unstyled}
        size="md"
        variant="transparent"
        aria-label={labels.exitPresentationLabel}
        aria-keyshortcuts="Escape"
        onClick={onExit}
      />
    </Box>
  );
}
