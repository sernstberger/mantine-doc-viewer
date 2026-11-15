import { getDocViewerType } from 'mantine-doc-viewer';

interface Attachment {
  name: string;
  url: string;
  mimeType?: string;
}

/** Groups attachments by how DocViewer will render them */
export function groupAttachments(attachments: Attachment[]) {
  const groups = new Map<string, Attachment[]>();

  for (const attachment of attachments) {
    const type = getDocViewerType({ src: attachment.url, mimeType: attachment.mimeType });
    groups.set(type, [...(groups.get(type) ?? []), attachment]);
  }

  return groups;
}
