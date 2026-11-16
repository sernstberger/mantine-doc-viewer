/**
 * Disabled look without the `disabled` attribute: a button that becomes disabled while
 * focused keeps focus instead of dropping it to the page. For bars that are not a Mantine
 * Toolbar: the button is not a tab stop of its own while unavailable
 */
export function softDisabled(disabled: boolean, onClick: () => void) {
  return {
    'aria-disabled': disabled || undefined,
    'data-disabled': disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
    onClick: () => !disabled && onClick(),
  };
}

/**
 * `softDisabled` for a button inside a Mantine Toolbar, such as Next page on the last page.
 * The Toolbar skips `data-disabled` buttons and ignores keys pressed on them, so the button
 * carries `data-soft-disabled` instead and the Toolbar keeps managing its tab index
 */
export function toolbarSoftDisabled(disabled: boolean, onClick: () => void) {
  return {
    'aria-disabled': disabled || undefined,
    'data-soft-disabled': disabled || undefined,
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

/**
 * Focuses `node` when focus was lost to the document body, as it is when the focused element is
 * removed. Focus the reader moved somewhere else stays where it is
 */
export function focusIfLost(node: HTMLElement | null | undefined) {
  if (node && node.ownerDocument.activeElement === node.ownerDocument.body) {
    node.focus();
  }
}
