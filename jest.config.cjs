module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  // esbuild-jest hands any file containing the text "ock(" (meant to catch jest.mock) to Babel,
  // which is not set up here. Avoid that text in names such as getCodeBlock(), and mock modules
  // through moduleNameMapper below instead of jest.mock().
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['./jsdom.mocks.cjs'],
  moduleNameMapper: {
    '/import-markdown$': '<rootDir>/test-utils/import-markdown.mock.tsx',
    '/import-pdfjs$': '<rootDir>/test-utils/import-pdfjs.mock.ts',
    '^pdfjs-dist$': '<rootDir>/test-utils/pdfjs-dist.mock.ts',
    '\\.(css)$': 'identity-obj-proxy',
  },
};
