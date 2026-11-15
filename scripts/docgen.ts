import { generateDeclarations } from 'mantine-docgen-script';
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

const outputPath = path.join(process.cwd(), 'docs');

async function docgen() {
  await generateDeclarations({
    componentsPaths: [
      getComponentPath('DocViewerBase.tsx'),
      ...PARTS.map((part) => getComponentPath(`DocViewer${part}/DocViewer${part}.tsx`)),
      getComponentPath('DocViewerPageEditor/DocViewerPageEditor.tsx'),
      getComponentPath(
        'DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton.tsx'
      ),
      getComponentPath('DocViewerMarkup/DocViewerMarkupBar/DocViewerMarkupBar.tsx'),
      getComponentPath('DocViewerMarkup/DocViewerMarkupButton/DocViewerMarkupButton.tsx'),
    ],
    tsConfigPath: path.join(process.cwd(), 'tsconfig.json'),
    outputPath,
  });

  /** Keys by component name, as the docs page asks for them: `DocViewer`, `DocViewerToolbar`, ... */
  const docgenPath = path.join(outputPath, 'docgen.json');
  const declarations: Record<string, unknown> = await fs.readJson(docgenPath);
  const renamed = Object.fromEntries(
    Object.entries(declarations).map(([key, value]) => [
      key.replace(/^mantine-doc-viewer\//, '').replace(/^DocViewerBase$/, 'DocViewer'),
      value,
    ])
  );
  await fs.writeJson(docgenPath, renamed, { spaces: 2 });
}

docgen();
