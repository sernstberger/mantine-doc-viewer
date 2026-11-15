import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useState } from 'react';
import { saveBytes } from '../files';
import { formatFileSize } from '../text/use-text-document';

export interface PdfProperty {
  key:
    | 'title'
    | 'author'
    | 'subject'
    | 'keywords'
    | 'creator'
    | 'producer'
    | 'created'
    | 'modified'
    | 'pdfVersion'
    | 'fileSize'
    | 'pageCount'
    | 'pageSize';
  value: string;
}

/** Turns a PDF date such as D:20240131120000+01'00' into a Date */
export function parsePdfDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match =
    /^D?:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Zz+-])?(\d{2})?'?(\d{2})?/.exec(value);
  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month = '01',
    day = '01',
    hour = '00',
    minute = '00',
    second = '00',
    zone,
    zoneHour = '00',
    zoneMinute = '00',
  ] = match;
  const offset = zone === '+' || zone === '-' ? `${zone}${zoneHour}:${zoneMinute}` : 'Z';
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Page size in inches and millimetres, from PDF points */
export function formatPageSize(width: number, height: number) {
  const inches = (points: number) => Math.round((points / 72) * 100) / 100;
  const millimetres = (points: number) => Math.round((points / 72) * 25.4);
  return `${inches(width)} × ${inches(height)} in (${millimetres(width)} × ${millimetres(height)} mm)`;
}

const INFO_KEYS: [PdfProperty['key'], string][] = [
  ['title', 'Title'],
  ['author', 'Author'],
  ['subject', 'Subject'],
  ['keywords', 'Keywords'],
  ['creator', 'Creator'],
  ['producer', 'Producer'],
];

/** Properties worth showing, in a fixed order, leaving out empty ones */
export function getPdfProperties(
  info: Record<string, unknown>,
  details: { fileSize?: number; pageCount: number; pageSize?: { width: number; height: number } },
  formatDate: (date: Date) => string
): PdfProperty[] {
  const properties: PdfProperty[] = [];
  const add = (key: PdfProperty['key'], value: unknown) =>
    typeof value === 'string' && value.trim() && properties.push({ key, value: value.trim() });

  INFO_KEYS.forEach(([key, infoKey]) => add(key, info[infoKey]));
  const created = parsePdfDate(info.CreationDate);
  const modified = parsePdfDate(info.ModDate);
  created && add('created', formatDate(created));
  modified && add('modified', formatDate(modified));
  add('pdfVersion', info.PDFFormatVersion);
  details.fileSize !== undefined && add('fileSize', formatFileSize(details.fileSize));
  add('pageCount', String(details.pageCount));
  details.pageSize &&
    add('pageSize', formatPageSize(details.pageSize.width, details.pageSize.height));
  return properties;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);

export function usePdfProperties(document: PDFDocumentProxy | null, opened: boolean) {
  const [properties, setProperties] = useState<PdfProperty[] | null>(null);

  useEffect(() => {
    if (!document || !opened || properties) {
      return undefined;
    }

    let cancelled = false;
    Promise.all([
      document.getMetadata().catch(() => ({ info: {} })),
      document.getDownloadInfo().catch(() => ({ length: undefined })),
      document
        .getPage(1)
        .then((page) => page.getViewport({ scale: 1 }))
        .catch(() => undefined),
    ]).then(([metadata, download, viewport]) => {
      if (!cancelled) {
        setProperties(
          getPdfProperties(
            metadata.info as Record<string, unknown>,
            { fileSize: download.length, pageCount: document.numPages, pageSize: viewport },
            formatDate
          )
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [document, opened, properties]);

  return properties;
}

export interface PdfAttachment {
  id: string;
  filename: string;
  description: string;
}

export function usePdfAttachments(document: PDFDocumentProxy | null) {
  const [attachments, setAttachments] = useState<PdfAttachment[]>([]);

  useEffect(() => {
    if (!document) {
      return undefined;
    }

    let cancelled = false;
    document
      .getAttachments()
      .then((found) => {
        !cancelled &&
          setAttachments(
            Array.from(found ?? [], ([id, attachment]) => ({
              id,
              filename: attachment.filename,
              description: attachment.description,
            }))
          );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [document]);

  return attachments;
}

/** Saves an attachment from the PDF as a file */
export async function downloadAttachment(document: PDFDocumentProxy, attachment: PdfAttachment) {
  const content = await document.getAttachmentContent(attachment.id);
  if (!content) {
    return;
  }

  saveBytes(content, attachment.filename);
}
