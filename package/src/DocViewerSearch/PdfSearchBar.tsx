import {
  ActionIcon,
  Box,
  BoxProps,
  CloseButton,
  ElementProps,
  type GetStylesApiOptions,
  TextInput,
  VisuallyHidden,
} from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import React from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerSearchInputProps } from '../doc-viewer.types';
import type { DocViewerLabels } from '../default-labels';
import type { SearchOptions } from '../utils/search';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '../utils/icons';
import { softDisabled } from '../utils/a11y';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';

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
  inputProps?: DocViewerSearchInputProps;

  /** className, style, classNames and styles of the `search` element */
  stylesOptions?: GetStylesApiOptions;

  /** Other props of the `search` element */
  elementProps?: BoxProps & ElementProps<'div'>;
  rootRef?: React.Ref<HTMLDivElement>;
}

function getCountLabel(
  { query, matchCount, activeIndex, searching }: PdfSearchBarProps,
  labels: DocViewerLabels
) {
  if (!query.trim()) {
    return '';
  }

  if (searching) {
    return labels.searchingLabel;
  }

  return matchCount === 0
    ? labels.noMatchesLabel
    : labels.matchOfLabel(activeIndex + 1, matchCount);
}

function getAnnouncement(
  { query, matchCount, activeIndex, activePage, searching }: PdfSearchBarProps,
  labels: DocViewerLabels
) {
  if (!query.trim() || searching) {
    return '';
  }

  return matchCount === 0 || activePage === undefined
    ? labels.noMatchesLabel
    : labels.matchOnPageLabel(activeIndex + 1, matchCount, activePage);
}

const OPTION_GLYPHS = [
  ['matchCase', 'Aa'],
  ['wholeWords', 'ab'],
  ['matchAccents', 'é'],
] as const;

function SearchOptionToggles({
  options,
  onOptionsChange,
}: Pick<PdfSearchBarProps, 'options' | 'onOptionsChange'>) {
  const { getStyles, labels } = useDocViewerContext();
  const controlProps = useControlProps();

  return OPTION_GLYPHS.map(([option, glyph]) => (
    <DocViewerTooltip key={option} label={labels[`${option}Label`]}>
      <ActionIcon
        {...controlProps(!!options[option])}
        aria-label={labels[`${option}Label`]}
        aria-pressed={!!options[option]}
        onClick={() => onOptionsChange({ ...options, [option]: !options[option] })}
      >
        <span {...getStyles('searchOption')} aria-hidden data-option={option}>
          {glyph}
        </span>
      </ActionIcon>
    </DocViewerTooltip>
  ));
}

function SearchResults(props: PdfSearchBarProps) {
  const { getStyles, labels } = useDocViewerContext();
  const controlProps = useControlProps();
  const { matchCount, onNext, onPrevious } = props;

  return (
    <>
      <span {...getStyles('searchCount')}>{getCountLabel(props, labels)}</span>
      <VisuallyHidden role="status">{getAnnouncement(props, labels)}</VisuallyHidden>
      <DocViewerTooltip label={labels.previousMatchLabel}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.previousMatchLabel}
          {...softDisabled(matchCount === 0, onPrevious)}
        >
          <ChevronUpIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <DocViewerTooltip label={labels.nextMatchLabel}>
        <ActionIcon
          {...controlProps()}
          aria-label={labels.nextMatchLabel}
          {...softDisabled(matchCount === 0, onNext)}
        >
          <ChevronDownIcon />
        </ActionIcon>
      </DocViewerTooltip>
    </>
  );
}

export function PdfSearchBar(props: PdfSearchBarProps) {
  const { inputRef, query, onQueryChange, onNext, onPrevious, onClose } = props;
  const { inputProps, stylesOptions, elementProps, rootRef } = props;
  const { getStyles, labels, size } = useDocViewerContext();

  const handleKeyDown = getHotkeyHandler([
    ['Enter', onNext],
    ['shift+Enter', onPrevious],
    ['Escape', onClose],
  ]);

  return (
    <Box ref={rootRef} {...getStyles('search', stylesOptions)} {...elementProps} role="search">
      <TextInput
        placeholder={labels.searchDocumentLabel}
        aria-label={labels.searchDocumentLabel}
        leftSection={<SearchIcon />}
        {...inputProps}
        ref={inputRef}
        size={size.input}
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        {...getStyles('searchInput')}
      />
      <SearchOptionToggles options={props.options} onOptionsChange={props.onOptionsChange} />
      <SearchResults {...props} />
      <CloseButton
        {...getStyles('control')}
        size={size.control}
        aria-label={labels.closeSearchLabel}
        onClick={onClose}
      />
    </Box>
  );
}
