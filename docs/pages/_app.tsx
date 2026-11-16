import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantinex/mantine-logo/styles.css';
import '@mantinex/mantine-header/styles.css';
import '@mantinex/demo/styles.css';
import 'mantine-doc-viewer/styles.css';
import { CodeHighlightAdapterProvider, createShikiAdapter } from '@mantine/code-highlight';
import { MantineProvider } from '@mantine/core';
import { AppProps } from 'next/app';
import Head from 'next/head';
import {
  createPdfJsAdapter,
  createReactMarkdownAdapter,
  DocViewerAdapterProvider,
} from 'mantine-doc-viewer';
import favicon from '../assets/favicon.svg';
import { theme } from '../theme';

async function loadShiki() {
  const { createHighlighter } = await import('shiki');
  const shiki = await createHighlighter({
    langs: ['tsx', 'ts', 'scss', 'html', 'bash', 'json', 'markdown', 'python'],
    themes: [],
  });

  return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const pdfAdapter = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });
const markdownAdapter = createReactMarkdownAdapter(() =>
  Promise.all([import('react-markdown'), import('remark-gfm')])
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
      <Head>
        <title>mantine-doc-viewer</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="shortcut icon" href={favicon.src} />
      </Head>
      <CodeHighlightAdapterProvider adapter={shikiAdapter}>
        <DocViewerAdapterProvider pdf={pdfAdapter} markdown={markdownAdapter}>
          <Component {...pageProps} />
        </DocViewerAdapterProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
}
