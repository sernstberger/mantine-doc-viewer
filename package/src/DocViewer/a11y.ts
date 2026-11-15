/**
 * Disabled look without the `disabled` attribute: a button that becomes disabled while
 * focused, such as Next page on the last page, keeps focus instead of dropping it to the page
 */
export function softDisabled(disabled: boolean, onClick: () => void) {
  return {
    'aria-disabled': disabled || undefined,
    'data-disabled': disabled || undefined,
    onClick: () => !disabled && onClick(),
  };
}

/**
 * Props that make a loaded document's scroll area a named region that can be focused and
 * scrolled with the keyboard. Nothing while loading, when there is nothing to scroll
 */
export function getRegionProps(ready: boolean, title: string, keyShortcuts?: string) {
  return ready
    ? { tabIndex: 0, role: 'region', 'aria-label': title, 'aria-keyshortcuts': keyShortcuts }
    : {};
}
