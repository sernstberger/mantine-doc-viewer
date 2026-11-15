/** Saves bytes as a file through the browser's download */
export function saveBytes(bytes: Uint8Array, fileName: string, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
