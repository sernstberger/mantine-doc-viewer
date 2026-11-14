import { ActionIcon, CloseButton, TextInput, Tooltip } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '../icons';

interface PdfSearchBarProps {
  inputRef: React.Ref<HTMLInputElement>;
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  activeIndex: number;
  searching: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

function getCountLabel({ query, matchCount, activeIndex, searching }: PdfSearchBarProps) {
  if (!query.trim()) {
    return '';
  }

  if (searching) {
    return 'Searching…';
  }

  return matchCount === 0 ? 'No matches' : `${activeIndex + 1} of ${matchCount}`;
}

export function PdfSearchBar(props: PdfSearchBarProps) {
  const { inputRef, query, onQueryChange, matchCount, onNext, onPrevious, onClose } = props;
  const { getStyles } = useDocViewerContext();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.shiftKey ? onPrevious() : onNext();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div {...getStyles('search')} role="search">
      <TextInput
        ref={inputRef}
        size="xs"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search document"
        aria-label="Search document"
        leftSection={<SearchIcon />}
        {...getStyles('searchInput')}
      />
      <span {...getStyles('searchCount')} aria-live="polite">
        {getCountLabel(props)}
      </span>
      <Tooltip label="Previous match">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Previous match"
          disabled={matchCount === 0}
          onClick={onPrevious}
        >
          <ChevronUpIcon />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Next match">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Next match"
          disabled={matchCount === 0}
          onClick={onNext}
        >
          <ChevronDownIcon />
        </ActionIcon>
      </Tooltip>
      <CloseButton size="sm" aria-label="Close search" onClick={onClose} />
    </div>
  );
}
