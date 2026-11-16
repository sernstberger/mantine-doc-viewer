import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { createMarkdownComponents, scrollToHeading } from './markdown-components';

describe('markdown components', () => {
  const onHashLink = jest.fn();
  const { a: Link, pre: Pre } = createMarkdownComponents({
    opensInNewTab: '(opens in new tab)',
    onHashLink,
  });

  it('keeps hash links in the viewer', async () => {
    render(<Link href="#install">Install</Link>);
    await userEvent.click(screen.getByRole('link', { name: 'Install' }));
    expect(onHashLink).toHaveBeenCalledWith('install');
  });

  it('opens other links in a new tab and says so', () => {
    render(<Link href="https://mantine.dev">Mantine</Link>);
    const link = screen.getByRole('link', { name: 'Mantine (opens in new tab)' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('highlights fenced code and leaves other pre elements alone', () => {
    const node = {
      type: 'element',
      tagName: 'pre',
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-ts'] },
          children: [{ type: 'text', value: 'const a = 1;\n' }],
        },
      ],
    };
    const { container } = render(<Pre node={node}>ignored</Pre>);
    expect(
      container.querySelector('.mantine-CodeHighlight-root, [class*="CodeHighlight"]')
    ).toBeInTheDocument();

    render(<Pre>plain text</Pre>);
    expect(screen.getByText('plain text').tagName).toBe('PRE');
  });

  it('highlights fenced code without a language as text', () => {
    const node = {
      type: 'element',
      tagName: 'pre',
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: [{ type: 'text', value: 'plain\n' }],
        },
      ],
    };
    render(<Pre node={node}>x</Pre>);
    expect(screen.getByText('plain')).toBeInTheDocument();
  });
});

describe('scrollToHeading', () => {
  it('scrolls the viewer to the heading and focuses it', () => {
    const scroller = document.createElement('div');
    const root = document.createElement('div');
    root.innerHTML = '<h2 id="getting-started">Getting started</h2>';
    scroller.append(root);
    document.body.append(scroller);
    scroller.scrollTo = jest.fn();

    expect(scrollToHeading(root, 'getting-started')).toBe(true);
    expect(scroller.scrollTo).toHaveBeenCalled();
    expect(document.activeElement).toBe(root.querySelector('h2'));
    expect(scrollToHeading(root, 'missing')).toBe(false);
    scroller.remove();
  });
});
