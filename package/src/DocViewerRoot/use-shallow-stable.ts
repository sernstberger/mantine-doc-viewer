import { shallowEqual } from '@mantine/hooks';
import { useRef } from 'react';

/**
 * The value from the last render while each of its fields is the same, so an object built on
 * every render (a context value, an inline `labels` prop) only changes when something in it does
 */
export function useShallowStable<T>(value: T): T {
  const stable = useRef(value);
  if (!shallowEqual(stable.current, value)) {
    stable.current = value;
  }
  return stable.current;
}
