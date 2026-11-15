module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  // esbuild-jest hands any file containing the text "ock(" (meant to catch jest.mock) to Babel,
  // which is not set up here. Avoid that text in names such as getCodeBlock(), and mock modules
  // through moduleNameMapper below instead of jest.mock().
  transform: {
    // es2022 keeps object spread as it is (no injected helpers that count as uncovered branches),
    // and source maps make coverage point at the source lines
    '^.+\\.tsx?$': ['esbuild-jest', { target: 'es2022', sourcemap: true }],
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  // Agent worktrees under .claude/ hold whole copies of the repo; their tests are not ours
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/e2e/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/e2e/'],
  // Every source file is fully covered; keep it that way
  // A summary in the terminal, and lcov for editors and CI
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
  collectCoverageFrom: [
    'package/src/**/*.{ts,tsx}',
    '!package/src/**/*.story.tsx',
    '!package/src/**/*.d.ts',
    // Dynamic import() wrappers: tests replace them with mocks (moduleNameMapper below), so they
    // never run in Jest. Each is one line that loads pdf-lib, or the code and markdown views
    '!package/src/utils/import-pdf-lib.ts',
    '!package/src/DocViewerRoot/import-views.ts',
  ],
  setupFilesAfterEnv: ['./jsdom.mocks.cjs', './jest-console.cjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '/legacy-engines$': '<rootDir>/test-utils/legacy-engines.mock.ts',
    '/import-pdf-lib$': '<rootDir>/test-utils/import-pdf-lib.mock.ts',
    '/import-views$': '<rootDir>/test-utils/import-views.mock.ts',
    '^pdfjs-dist$': '<rootDir>/test-utils/pdfjs-dist.mock.ts',
    '\\.(css)$': 'identity-obj-proxy',
  },
};
