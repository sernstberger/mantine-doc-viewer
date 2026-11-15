import { getRegionProps, softDisabled } from './a11y';

describe('a11y helpers', () => {
  it('makes a loaded scroll area a named, focusable region', () => {
    expect(getRegionProps(true, 'report.pdf', 'Control+F')).toEqual({
      tabIndex: 0,
      role: 'region',
      'aria-label': 'report.pdf',
      'aria-keyshortcuts': 'Control+F',
    });
    expect(getRegionProps(false, 'report.pdf')).toEqual({});
  });

  it('keeps soft disabled buttons focusable and ignores their clicks', () => {
    const onClick = jest.fn();
    const disabled = softDisabled(true, onClick);
    disabled.onClick();
    expect(disabled['aria-disabled']).toBe(true);
    expect(onClick).not.toHaveBeenCalled();

    softDisabled(false, onClick).onClick();
    expect(onClick).toHaveBeenCalled();
  });
});
