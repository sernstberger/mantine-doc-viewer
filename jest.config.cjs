module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['./jsdom.mocks.cjs'],
  moduleNameMapper: {
    '/import-pdfjs$': '<rootDir>/test-utils/import-pdfjs.mock.ts',
    '^pdfjs-dist$': '<rootDir>/test-utils/pdfjs-dist.mock.ts',
    '\\.(css)$': 'identity-obj-proxy',
  },
};
