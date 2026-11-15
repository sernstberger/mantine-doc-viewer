import { CloseButton } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { formatNumber } from '../format';

interface PdfPresentationControlsProps {
  currentPage: number;
  numPages: number;
  onExit: () => void;
}

/** The page count and the exit button over a presentation */
export function PdfPresentationControls({
  currentPage,
  numPages,
  onExit,
}: PdfPresentationControlsProps) {
  const { getStyles, labels, locale } = useDocViewerContext();
  return (
    <div {...getStyles('presentationControls')}>
      <span>
        {formatNumber(currentPage, locale)} / {formatNumber(numPages, locale)}
      </span>
      <CloseButton
        size="sm"
        variant="transparent"
        c="white"
        aria-label={labels.exitPresentation}
        aria-keyshortcuts="Escape"
        onClick={onExit}
      />
    </div>
  );
}
