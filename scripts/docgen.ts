import { createRequire } from 'node:module';
import fs from 'fs-extra';
import path from 'path';

const getComponentPath = (componentPath: string) =>
  path.join(process.cwd(), 'package/src', componentPath);

const PARTS = [
  'Root',
  'Toolbar',
  'Title',
  'PageControls',
  'ZoomControls',
  'ThumbnailsButton',
  'RotateButton',
  'LayoutMenu',
  'OutlineButton',
  'InfoButton',
  'PresentationButton',
  'SearchButton',
  'PrintButton',
  'DownloadButton',
  'FullscreenButton',
  'WrapButton',
  'ViewModeControl',
  'Main',
  'Body',
  'Pages',
  'Thumbnails',
  'Search',
  'Outline',
  'DocumentInfo',
  'PresentationControls',
  'OverlayControls',
  'Image',
  'Text',
  'Code',
  'Markdown',
  'Message',
  'Loading',
];

/** Parts of the subpath entries, `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup` */
const EXTENSION_PARTS = [
  'DocViewerPageEditor/DocViewerPageEditor.tsx',
  'DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton.tsx',
  'DocViewerMarkup/DocViewerMarkupBar/DocViewerMarkupBar.tsx',
  'DocViewerMarkup/DocViewerMarkupButton/DocViewerMarkupButton.tsx',
];

const outputPath = path.join(process.cwd(), 'docs');

/** `DocViewerToolbarStylesNames = 'toolbar' | 'toolbarSection'` in a part's file, as a list */
function readStylesNames(source: string, part: string): string[] {
  const match = source.match(new RegExp(`export type ${part}StylesNames =([^;]+);`));
  return match ? [...match[1].matchAll(/'([A-Za-z]+)'/g)].map((name) => name[1]) : [];
}

/** Which Styles API selectors each part uses, read from the `StylesNames` type of the part */
async function writePartSelectors(partFiles: Record<string, string>) {
  const selectors: Record<string, string[]> = {};
  for (const [part, file] of Object.entries(partFiles)) {
    selectors[part] = readStylesNames(await fs.readFile(file, 'utf8'), part);
  }
  await fs.writeJson(path.join(outputPath, 'part-selectors.json'), selectors, { spaces: 2 });
}

async function docgen() {
  // react-docgen-typescript names every component of a file after the first factory in it (the
  // displayName literal it reads) and drops the rest as duplicates: DocViewerBody.tsx holds the
  // useDocViewerContext hook with its JSDoc and was documented with the hook's text and no props.
  // mantine-docgen-script does not expose the parser options, so the parser is given the export
  // name as the component name before the script loads it, through require so that the script
  // gets the swapped module (an import() of its ESM build reads the original)
  const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const modulePath = nodeRequire.resolve('react-docgen-typescript');
  const original = nodeRequire(modulePath);

  nodeRequire.cache[modulePath]!.exports = {
    ...original,
    withCustomConfig: (tsconfigPath: string, parserOptions: object) =>
      original.withCustomConfig(tsconfigPath, {
        ...parserOptions,
        componentNameResolver: (exp: { escapedName: string }) => exp.escapedName,
      }),
  };

  const { generateDeclarations } = nodeRequire('mantine-docgen-script');

  const partFiles: Record<string, string> = Object.fromEntries([
    ['DocViewer', getComponentPath('DocViewerBase.tsx')],
    ...PARTS.map((part) => [
      `DocViewer${part}`,
      getComponentPath(`DocViewer${part}/DocViewer${part}.tsx`),
    ]),
    ...EXTENSION_PARTS.map((file) => [path.basename(file, '.tsx'), getComponentPath(file)]),
  ]);

  await generateDeclarations({
    componentsPaths: Object.values(partFiles),
    tsConfigPath: path.join(process.cwd(), 'tsconfig.json'),
    outputPath,
  });

  /** Keys by component name, as the docs page asks for them: `DocViewer`, `DocViewerToolbar`, ... */
  const docgenPath = path.join(outputPath, 'docgen.json');
  const declarations: Record<string, unknown> = await fs.readJson(docgenPath);
  const renamed = Object.fromEntries(
    Object.entries(declarations).map(([key, value]) => [
      key.replace(/^DocViewerBase$/, 'DocViewer'),
      value,
    ])
  );

  const missing = Object.keys(partFiles).filter((part) => !(part in renamed));
  if (missing.length > 0) {
    throw new Error(`docgen did not document: ${missing.join(', ')}`);
  }

  await fs.writeJson(docgenPath, renamed, { spaces: 2 });
  await writePartSelectors(partFiles);
}

docgen();
