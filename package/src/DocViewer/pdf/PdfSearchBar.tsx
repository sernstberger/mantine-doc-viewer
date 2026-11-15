import { ActionIcon, CloseButton, TextInput, VisuallyHidden } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import type { DocViewerLabels } from '../labels';
import type { SearchOptions } from './search';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '../icons';
import { softDisabled } from '../a11y';
import { DocViewerTooltip, useControlProps } from '../controls';

interface PdfSearchBarProps {
  inputRef: React.Ref<HTMLInputElement>;
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  activeIndex: number;

  /** Page of the active match */
  activePage: number | undefined;
  searching: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  options: SearchOptions;
  onOptionsChange: (options: SearchOptions) => void;
}

function getCountLabel(
  { query, matchCount, activeIndex, searching }: PdfSearchBarProps,
  labels: DocViewerLabels
) {
  if (!query.trim()) {
    return '';
  }

  if (searching) {
    return labels.searching;
  }

  return matchCount === 0 ? labels.noMatches : labels.matchOf(activeIndex + 1, matchCount);
}

function getAnnouncement(
  { query, matchCount, activeIndex, activePage, searching }: PdfSearchBarProps,
  labels: DocViewerLabels
) {
  if (!query.trim() || searching) {
    return '';
  }

  return matchCount === 0 || activePage === undefined
    ? labels.noMatches
    : labels.matchOnPage(activeIndex + 1, matchCount, activePage);
}

export function PdfSearchBar(props: PdfSearchBarProps) {
  const {
    inputRef,
    query,
    onQueryChange,
    matchCount,
    onNext,
    onPrevious,
    onClose,
    options,
    onOptionsChange,
  } = props;
  const { getStyles, labels, size } = useDocViewerContext();
  const controlProps = useControlProps();

  const handleKeyDown = getHotkeyHandler([
    ['Enter', onNext],
    ['shift+Enter', onPrevious],
    ['Escape', onClose],
  ]);

  return (
    <div {...getStyles('search')} role="search">
      <TextInput
        ref={inputRef}
        size={size.input}
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={labels.searchDocument}
        aria-label={labels.searchDocument}
        leftSection={<SearchIcon />}
        {...getStyles('searchInput')}
      />
      {(
        [
          ['matchCase', 'Aa'],
          ['wholeWords', 'ab'],
          ['matchAccents', 'é'],
        ] as const
      ).map(([option, glyph]) => (
        <DocViewerTooltip key={option} label={labels[option]}>
          <ActionIcon
            {...controlProps(!!options[option])}
            aria-label={labels[option]}
            aria-pressed={!!options[option]}
            onClick={() => onOptionsChange({ ...options, [option]: !options[option] })}
          >
            <span {...getStyles('searchOption')} aria-hidden data-option={option}>
              {glyph}
            </span>
          </ActionIcon>
        </DocViewerTooltip>
      ))}
      <span {...getStyles('searchCount')}>{getCountLabel(props, labels)}</span>
      {/* Read out once the results have settled, with the page, but not "Searching…" on every key */}
      <VisuallyHidden role="status">{getAnnouncement(props, labels)}</VisuallyHidden>
      <DocViewerTooltip label={labels.previousMatch}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.previousMatch}
          {...softDisabled(matchCount === 0, onPrevious)}
        >
          <ChevronUpIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={labels.nextMatch}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.nextMatch}
          {...softDisabled(matchCount === 0, onNext)}
        >
          <ChevronDownIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <CloseButton
        {...getStyles('control')}
        size={size.control}
        aria-label={labels.closeSearch}
        onClick={onClose}
      />
    </div>
  );
}
