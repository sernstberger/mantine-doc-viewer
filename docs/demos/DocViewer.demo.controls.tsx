import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer
      src="/sample-image.svg"
      withOverlayControls
      toolbarControls={{ rotate: false, print: false, download: false }}
      toolbarProps={{ subtitle: 'Overlay controls float over the image' }}
      h={360}
    />
  );
}
`;

function Demo() {
  return (
    <DocViewer
      src={asset('sample-image.svg')}
      withOverlayControls
      toolbarControls={{ rotate: false, print: false, download: false }}
      toolbarProps={{ subtitle: 'Overlay controls float over the image' }}
      h={360}
    />
  );
}

export const controls: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
