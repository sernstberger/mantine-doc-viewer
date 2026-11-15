# mantine-doc-viewer

Document viewer for [Mantine](https://mantine.dev): PDFs, images, plain text, code, JSON and
markdown in one component, with the Mantine Styles API, light and dark themes, and full keyboard
and screen reader support.

**[Documentation and demos](https://sernstberger.github.io/mantine-doc-viewer/)**

## Features

- **PDF** (pdf.js): search with match case, whole words and accents, thumbnails on any side,
  outline, clickable links, page layouts (single, two pages, cover, horizontal, wrapped),
  rotation, document info, attachments and layers, presentation mode, password protected files
- **Page editing** (opt in): reorder, remove and extract pages, saved as a new PDF
- **Images**: fit, zoom around the pointer, pinch, rotate, drag to pan
- **Text, code, JSON and markdown**: highlighting with `@mantine/code-highlight`, a JSON tree,
  GitHub flavoured markdown rendered safely
- **Large documents**: only pages near the view are drawn, and only the parts of a PDF on screen
  are downloaded when the server supports range requests
- **Print, download and full screen**, a `controllerRef` with every action, and events for load,
  errors, page, zoom and links
- **Customisable**: `size`, `color`, `variant="plain"`, dark pages, hideable toolbar controls,
  translatable labels, and renderers for other file types
- **Small**: about 24 kB gzipped; pdf.js and the markdown renderer load only when needed

## Installation

```bash
npm install mantine-doc-viewer @mantine/core @mantine/hooks @mantine/code-highlight pdfjs-dist
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

The file type comes from `mimeType`, the file name or the url. Images, text, code and markdown
need nothing else. See the [documentation](https://sernstberger.github.io/mantine-doc-viewer/)
for every prop, the Styles API, events and the controller.

## Requirements

- Mantine 9.7 or newer, React 19.2 or newer, pdfjs-dist 6.5 or newer
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
