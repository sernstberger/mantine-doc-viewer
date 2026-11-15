/** File name for a saved, extracted or marked up document, from the original */
export function getEditedFileName(fileName: string | undefined, suffix: string) {
  const base = (fileName ?? 'document.pdf').replace(/\.pdf$/i, '');
  return `${base}-${suffix}.pdf`;
}
