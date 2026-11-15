import { focusIfLost, getRegionProps, softDisabled } from './a11y';

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
    expect(disabled.tabIndex).toBe(-1);
    expect(onClick).not.toHaveBeenCalled();

    expect(softDisabled(false, onClick).tabIndex).toBeUndefined();
    softDisabled(false, onClick).onClick();
    expect(onClick).toHaveBeenCalled();
  });

  it('focuses a node only when focus was lost to the body', () => {
    const target = document.createElement('button');
    const other = document.createElement('button');
    document.body.append(target, other);

    focusIfLost(null);
    expect(document.body).toHaveFocus();
    focusIfLost(target);
    expect(target).toHaveFocus();

    other.focus();
    focusIfLost(target);
    expect(other).toHaveFocus();
    target.remove();
    other.remove();
  });
});
