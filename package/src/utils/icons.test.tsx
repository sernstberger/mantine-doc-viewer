import { render } from '@mantine-tests/core';
import React from 'react';
import * as markupIcons from '../DocViewerMarkup/markup-icons';
import * as icons from './icons';

describe('icons', () => {
  it('renders every icon as a hidden svg and passes props on', () => {
    const { Icon: _base, ...shared } = icons;
    Object.values({ ...shared, ...markupIcons }).forEach((Icon) => {
      const { container, unmount } = render(<Icon data-testid="icon" />);
      const svg = container.querySelector('svg')!;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('data-testid', 'icon');
      unmount();
    });
  });
});
