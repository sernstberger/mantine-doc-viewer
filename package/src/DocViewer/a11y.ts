/** Tooltips also show on keyboard focus, so keyboard users can see what an icon button does */
export const TOOLTIP_EVENTS = { hover: true, focus: true, touch: false };

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
