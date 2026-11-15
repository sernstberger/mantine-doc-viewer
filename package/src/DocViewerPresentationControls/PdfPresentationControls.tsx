import { Box, BoxProps, CloseButton, ElementProps, type GetStylesApiOptions } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import { formatNumber } from '../utils/format';

interface PdfPresentationControlsProps {
  currentPage: number;
  numPages: number;
  onExit: () => void;

  /** className, style, classNames and styles of the `presentationControls` element */
  stylesOptions?: GetStylesApiOptions;

  /** Other props of the `presentationControls` element */
  elementProps?: BoxProps & ElementProps<'div'>;
  rootRef?: React.Ref<HTMLDivElement>;
}

/** The page count and the exit button over a presentation */
export function PdfPresentationControls({
  currentPage,
  numPages,
  onExit,
  stylesOptions,
  elementProps,
  rootRef,
}: PdfPresentationControlsProps) {
  const { getStyles, labels, locale } = useDocViewerContext();
  return (
    <Box ref={rootRef} {...getStyles('presentationControls', stylesOptions)} {...elementProps}>
      <span>
        {formatNumber(currentPage, locale)} / {formatNumber(numPages, locale)}
      </span>
      <CloseButton
        size="sm"
        variant="transparent"
        c="white"
        aria-label={labels.exitPresentationLabel}
        aria-keyshortcuts="Escape"
        onClick={onExit}
      />
    </Box>
  );
}
