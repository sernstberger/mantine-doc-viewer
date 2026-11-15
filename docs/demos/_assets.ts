const basePath = process.env.NODE_ENV === 'production' ? '/mantine-doc-viewer' : '';

/** Url of a file of `docs/public`, which is served under the repository name on GitHub pages */
export const asset = (fileName: string) => `${basePath}/${fileName}`;
