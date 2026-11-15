export type DocType = 'pdf' | 'image' | 'markdown' | 'code' | 'text' | 'unknown';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdx'];
const TEXT_EXTENSIONS = ['txt', 'log', 'csv', 'tsv'];
const CODE_EXTENSIONS = [
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'json',
  'css',
  'scss',
  'html',
  'xml',
  'yml',
  'yaml',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'h',
  'cpp',
  'cs',
  'php',
  'sh',
  'sql',
  'toml',
];

function fromMimeType(mimeType: string): DocType | null {
  const mime = mimeType.toLowerCase().split(';')[0].trim();
  if (mime === 'application/pdf') {
    return 'pdf';
  }
  if (mime.startsWith('image/')) {
    return 'image';
  }
  if (mime === 'text/markdown' || mime === 'text/x-markdown') {
    return 'markdown';
  }
  if (
    mime === 'application/json' ||
    mime === 'text/javascript' ||
    mime === 'text/css' ||
    mime === 'text/html'
  ) {
    return 'code';
  }
  if (mime.startsWith('text/')) {
    return 'text';
  }
  return null;
}

function getExtension(source: string): string | null {
  const path = source.split(/[?#]/)[0];
  const fileName = path.split('/').pop() ?? '';
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(dotIndex + 1).toLowerCase() : null;
}

function fromExtension(extension: string): DocType {
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }
  if (MARKDOWN_EXTENSIONS.includes(extension)) {
    return 'markdown';
  }
  if (CODE_EXTENSIONS.includes(extension)) {
    return 'code';
  }
  if (TEXT_EXTENSIONS.includes(extension)) {
    return 'text';
  }
  return 'unknown';
}

/** Extensions whose highlighter language has a different name */
const LANGUAGE_ALIASES: Record<string, string> = {
  mjs: 'js',
  cjs: 'js',
  yml: 'yaml',
  h: 'c',
  kt: 'kotlin',
  rs: 'rust',
  rb: 'ruby',
  py: 'python',
  sh: 'bash',
  cs: 'csharp',
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx',
};

/** Highlighter language for a code file, taken from its file name or url */
export function getCodeLanguage({ src, fileName }: Pick<DetectDocTypeInput, 'src' | 'fileName'>) {
  for (const candidate of [fileName, src]) {
    const extension = candidate ? getExtension(candidate) : null;
    if (extension) {
      return LANGUAGE_ALIASES[extension] ?? extension;
    }
  }

  return undefined;
}

export interface DetectDocTypeInput {
  /** File url, path or file name */
  src?: string;

  /** MIME type, takes precedence over the file extension */
  mimeType?: string;

  /** File name, used when `src` has no extension, for example, a blob url */
  fileName?: string;
}

/** Works out how a document should be rendered from its MIME type, file name or url */
export function detectDocType({ src, mimeType, fileName }: DetectDocTypeInput): DocType {
  if (mimeType) {
    const type = fromMimeType(mimeType);
    if (type) {
      return type;
    }
  }

  if (src?.startsWith('data:')) {
    const type = fromMimeType(src.slice(5).split(/[;,]/)[0]);
    if (type) {
      return type;
    }
  }

  for (const candidate of [fileName, src]) {
    const extension = candidate ? getExtension(candidate) : null;
    if (extension) {
      return fromExtension(extension);
    }
  }

  return 'unknown';
}
