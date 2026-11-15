/** Saves bytes as a file through the browser's download */
export function saveBytes(bytes: Uint8Array, fileName: string, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** File name for a saved, extracted or marked up document, from the original */
export function getEditedFileName(fileName: string | undefined, suffix: string) {
  const base = (fileName ?? 'document.pdf').replace(/\.pdf$/i, '');
  return `${base}-${suffix}.pdf`;
}
