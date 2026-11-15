import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import { CodeHighlightAdapterProvider, createShikiAdapter } from '@mantine/code-highlight';
import { MantineProvider } from '@mantine/core';
import type { Preview } from '@storybook/react';
import React, { useEffect } from 'react';
import { useGlobals } from '@storybook/preview-api';
import { repoDecorators } from './repo';

const shikiAdapter = createShikiAdapter(async () => {
  const { createHighlighter } = await import('shiki');
  return createHighlighter({
    langs: ['tsx', 'ts', 'json', 'markdown', 'python', 'bash'],
    themes: [],
  });
});

const preview: Preview = {
  parameters: {
    options: {
      // Component titles alphabetically, then the showcase apps; no type annotations here:
      // Storybook evaluates this function statically
      storySort: (a, b) => {
        const appA = a.title.startsWith('Apps/');
        const appB = b.title.startsWith('Apps/');
        return appA === appB
          ? a.title.localeCompare(b.title, undefined, { numeric: true })
          : appA
            ? 1
            : -1;
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Mantine color scheme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  decorators: [
    ...repoDecorators,
    (renderStory: any, context: any) => {
      const [{ theme }, updateGlobals] = useGlobals();

      useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
          const isMod = event.metaKey || event.ctrlKey;
          const isJ = event.code === 'KeyJ';

          if (!isMod || !isJ) {
            return;
          }

          event.preventDefault();
          updateGlobals({ theme: theme === 'dark' ? 'light' : 'dark' });
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [theme, updateGlobals]);

      const scheme = (context.globals.theme || 'light') as 'light' | 'dark';

      // StrictMode mounts, unmounts and mounts again in development (storybook dev, e2e:dev), so
      // effects that do not clean up after themselves show up there
      return (
        <React.StrictMode>
          <MantineProvider forceColorScheme={scheme}>
            <CodeHighlightAdapterProvider adapter={shikiAdapter}>
              {renderStory()}
            </CodeHighlightAdapterProvider>
          </MantineProvider>
        </React.StrictMode>
      );
    },
  ],
};

export default preview;
