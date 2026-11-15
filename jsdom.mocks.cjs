/* oxlint-disable no-console */
const { format } = require('node:util');
require('@testing-library/jest-dom');

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Not implemented in jsdom
Element.prototype.scrollTo = function scrollTo() {};
Element.prototype.scrollBy = function scrollBy() {};

// jsdom has no PointerEvent: Mantine's useDrag needs pointerId and pointerType
if (!window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  window.PointerEvent = PointerEvent;
}
Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} };
};

const unexpectedConsoleCalls = [];

function recordConsoleCall(level, data) {
  let testName = '';
  try {
    testName = expect.getState().currentTestName || '';
  } catch {
    testName = '';
  }
  const origin = testName ? ` (emitted while running "${testName}")` : '';
  unexpectedConsoleCalls.push(`console.${level}${origin}: ${format(...data)}`);
}

function failOnUnexpectedConsoleCalls() {
  if (unexpectedConsoleCalls.length === 0) {
    return;
  }

  const calls = unexpectedConsoleCalls.splice(0);
  throw new Error(
    `Test emitted ${calls.length} unexpected console call(s):\n\n${calls.join('\n\n')}`
  );
}

function isIgnoredConsoleCall(data, fragment) {
  return typeof data[0]?.toString === 'function' && data[0].toString().includes(fragment);
}

const originalConsoleError = console.error;
console.error = (...data) => {
  if (isIgnoredConsoleCall(data, 'Error: Could not parse CSS stylesheet')) {
    return;
  }
  recordConsoleCall('error', data);
  originalConsoleError(...data);
};

const originalConsoleWarn = console.warn;
console.warn = (...data) => {
  recordConsoleCall('warn', data);
  originalConsoleWarn(...data);
};

// Any console.error/console.warn emitted during a test fails it. Fix the cause (state updates
// outside act(), invalid props, React warnings) instead of mocking the console. A warning that
// fires between tests is reported on the next test or, after the last test, on the suite.
afterEach(failOnUnexpectedConsoleCalls);
afterAll(failOnUnexpectedConsoleCalls);
