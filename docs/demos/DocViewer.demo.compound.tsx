import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer.Root src="/sample.pdf" defaultThumbnailsOpened h={500}>
      <DocViewer.Toolbar />
      <DocViewer.Search />
      <DocViewer.Main>
        <DocViewer.Thumbnails width={96} />
        <DocViewer.Pages gap="xl" />
      </DocViewer.Main>
    </DocViewer.Root>
  );
}
`;

function Demo() {
  return (
    <DocViewer.Root src={asset('sample.pdf')} defaultThumbnailsOpened h={500}>
      <DocViewer.Toolbar />
      <DocViewer.Search />
      <DocViewer.Main>
        <DocViewer.Thumbnails width={96} />
        <DocViewer.Pages gap="xl" />
      </DocViewer.Main>
    </DocViewer.Root>
  );
}

export const compound: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
