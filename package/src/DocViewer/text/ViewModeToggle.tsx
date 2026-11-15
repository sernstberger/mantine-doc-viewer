import { SegmentedControl } from '@mantine/core';
import React from 'react';
import { useDocViewerContext } from '../DocViewer.context';

interface ViewModeToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  data: { value: T; label: string }[];
  label: string;
}

/** Switch between two ways of showing a file, such as rendered markdown and its source */
export function ViewModeToggle<T extends string>({
  value,
  onChange,
  data,
  label,
}: ViewModeToggleProps<T>) {
  const { size } = useDocViewerContext();

  return (
    <SegmentedControl
      size={size.input}
      value={value}
      onChange={(next) => onChange(next as T)}
      data={data}
      aria-label={label}
    />
  );
}
