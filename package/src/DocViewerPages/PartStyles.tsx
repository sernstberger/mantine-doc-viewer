import { type GetStylesApiOptions } from '@mantine/core';
import { shallowEqual } from '@mantine/hooks';
import { type ReactNode, useMemo, useRef } from 'react';
import {
  DocViewerProvider,
  useDocViewerContext,
  type DocViewerContextValue,
} from '../doc-viewer.context';

interface PartStylesProps {
  classNames: GetStylesApiOptions['classNames'];
  styles: GetStylesApiOptions['styles'];

  /** Fields of the viewer context that differ inside the part */
  overrides?: Partial<DocViewerContextValue>;
  children: ReactNode;
}

/** The value from the last render while it is shallow-equal, for `classNames` objects written inline */
function useStableMap<T>(value: T): T {
  const stable = useRef(value);
  if (typeof value !== 'object' || !shallowEqual(stable.current as object, value as object)) {
    stable.current = value;
  }
  return stable.current;
}

/**
 * Applies the `classNames` and `styles` of a part to every Styles API selector inside it, as
 * Mantine parts pass `classNames` and `styles` to each element, and gives the part's subtree
 * the context fields it overrides
 */
export function PartStyles({ classNames, styles, overrides, children }: PartStylesProps) {
  const context = useDocViewerContext();
  const stableClassNames = useStableMap(classNames);
  const stableStyles = useStableMap(styles);
  const stableOverrides = useStableMap(overrides);

  const value = useMemo<DocViewerContextValue>(() => {
    const { getStyles } = context;
    const scoped: DocViewerContextValue['getStyles'] = (selector, options) =>
      getStyles(selector, {
        ...options,
        classNames: options?.classNames ?? stableClassNames,
        styles: options?.styles ?? stableStyles,
      });
    return {
      ...context,
      ...stableOverrides,
      getStyles: stableClassNames || stableStyles ? scoped : getStyles,
    };
  }, [context, stableClassNames, stableStyles, stableOverrides]);

  return <DocViewerProvider value={value}>{children}</DocViewerProvider>;
}
