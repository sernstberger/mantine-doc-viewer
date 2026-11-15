import { MantineBreakpoint, useMatches } from '@mantine/core';

/**
 * A value, or values per `theme.breakpoints` key like Mantine style props,
 * for example `{ base: 'xs', sm: 'md' }`
 */
export type DocViewerResponsive<T> = T | Partial<Record<'base' | MantineBreakpoint, T>>;

function isBreakpointMap<T>(
  value: DocViewerResponsive<T> | undefined
): value is Partial<Record<'base' | MantineBreakpoint, T>> {
  return typeof value === 'object' && value !== null;
}

/**
 * Value for the current viewport width. Like Mantine's `useMatches`, it gives the `base` value on
 * the first render (and on the server), then the breakpoint value once media queries run
 */
export function useResponsiveValue<T>(value: DocViewerResponsive<T> | undefined): T | undefined {
  return useMatches(isBreakpointMap(value) ? value : { base: value });
}
