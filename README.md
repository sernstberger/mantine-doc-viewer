# mantine-doc-viewer

Document viewer for [Mantine](https://mantine.dev): PDFs, images, plain text, code, JSON and
markdown in one component, with the Mantine Styles API, light and dark themes, and full keyboard
and screen reader support.

**[Documentation and demos](https://sernstberger.github.io/mantine-doc-viewer/)**

## Features

- **PDF** (pdf.js): search with match case, whole words and accents, thumbnails on any side,
  outline, clickable links, page layouts (single, two pages, cover, horizontal, wrapped),
  rotation, document info, attachments and layers, presentation mode, password protected files
- **Page editing** (opt in, `mantine-doc-viewer/editor`): reorder, remove and extract pages, saved as a new PDF
- **Markup** (opt in, `mantine-doc-viewer/markup`): highlight, text box, shapes and signature, saved into the PDF
- **Images**: fit, zoom around the pointer, pinch, rotate, drag to pan
- **Text, code, JSON and markdown**: highlighting with `@mantine/code-highlight`, a JSON tree,
  GitHub flavoured markdown rendered safely
- **Large documents**: only pages near the view are drawn, and only the parts of a PDF on screen
  are downloaded when the server supports range requests
- **Print, download and full screen**, a store with state and every action (`useDocViewer`), and events for load,
  errors, page, zoom and links
- **Customisable**: `size`, `color`, `variant="plain"`, dark pages, hideable toolbar controls,
  translatable labels, and renderers for other file types
- **Small**: about 36 kB of JavaScript and 4 kB of CSS, gzipped and without Mantine; pdf.js, the markdown renderer and the code view load only when needed

## Installation

```bash
npm install mantine-doc-viewer @mantine/core @mantine/hooks @mantine/code-highlight
```

The engines are optional peer dependencies; install the ones you use:

```bash
npm install pdfjs-dist                  # PDFs
npm install @cantoo/pdf-lib             # page editing (the /editor subpath)
npm install react-markdown remark-gfm   # markdown
```

Import the styles once, next to Mantine's:

```tsx
import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import 'mantine-doc-viewer/styles.css';
```

## Usage

PDFs need an adapter that loads your installed `pdfjs-dist` and its worker:

```tsx
import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import 'mantine-doc-viewer/styles.css';

import { MantineProvider } from '@mantine/core';
import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from 'mantine-doc-viewer';
// Vite; with webpack or Next.js use new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const pdf = createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc });

function Demo() {
  return (
    <MantineProvider>
      <DocViewerAdapterProvider pdf={pdf}>
        <DocViewer src="/files/report.pdf" h={600} />
      </DocViewerAdapterProvider>
    </MantineProvider>
  );
}
```

The file type comes from `mimeType`, the file name or the url. Images, text and code need no
adapter. Markdown uses `createReactMarkdownAdapter(() => Promise.all([import('react-markdown'), import('remark-gfm')]))`
in the same provider, and page editing and markup are extensions from `mantine-doc-viewer/editor`
and `mantine-doc-viewer/markup`. See the [documentation](https://sernstberger.github.io/mantine-doc-viewer/)
for every part and prop, the Styles API, events and the store.

## Requirements

- Mantine 9.7 or newer, React 19.2 or newer, pdfjs-dist 6.5 or newer (optional, for PDFs)
- Current versions of Chrome, Edge, Firefox and Safari. Search highlights use the CSS Custom
  Highlight API; where it is missing, search still finds and scrolls to matches.

## Development

This repo was created from [mantinedev/extension-template](https://github.com/mantinedev/extension-template).

- `nvm use` then `yarn` — install dependencies
- `npm run storybook` — Storybook
- `npm run dev` — documentation site
- `npm run build` — build the package into `package/dist`
- `npm test` — syncpack, format, typecheck, lint, and Jest with 100% coverage required
- `npx tsx scripts/generate-sample-pdf.ts` — regenerate the sample PDFs

## License

MIT
