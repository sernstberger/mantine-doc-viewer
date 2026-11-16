import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer
      src="/sample.pdf"
      locale="de-DE"
      labels={{
        previousPageLabel: 'Vorherige Seite',
        nextPageLabel: 'Nächste Seite',
        pageOfLabel: (page, total) => \`Seite \${page} von \${total}\`,
        zoomInLabel: 'Vergrößern',
        zoomOutLabel: 'Verkleinern',
        downloadLabel: 'Herunterladen',
        printLabel: 'Drucken',
      }}
      h={440}
    />
  );
}
`;

function Demo() {
  return (
    <DocViewer
      src={asset('sample.pdf')}
      locale="de-DE"
      labels={{
        previousPageLabel: 'Vorherige Seite',
        nextPageLabel: 'Nächste Seite',
        pageOfLabel: (page, total) => `Seite ${page} von ${total}`,
        zoomInLabel: 'Vergrößern',
        zoomOutLabel: 'Verkleinern',
        downloadLabel: 'Herunterladen',
        printLabel: 'Drucken',
      }}
      h={440}
    />
  );
}

export const labels: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
