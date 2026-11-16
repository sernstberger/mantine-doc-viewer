/**
 * Firefox logs this notice when pdf.js 6.5.438 streams the content of a page (text, operators,
 * rendering). It was reproduced on a bare pdf.js page with no code of ours, and no pdf.js option
 * avoids it. Stories that render a PDF declare it, so the browser tests still fail on any other
 * console warning or error.
 */
export const pdfJsFirefoxNotice = /The execution of microtasks on this page was reordered/;

/** Story parameters of a story file that renders a PDF */
export const pdfConsole = { e2e: { allowConsole: [pdfJsFirefoxNotice] } };
