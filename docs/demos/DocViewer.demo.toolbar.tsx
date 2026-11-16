import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer.Root src="/sample.pdf" size="sm" h={500}>
      <DocViewer.Toolbar subtitle="Draft 4">
        <DocViewer.PageControls />
        <DocViewer.ZoomControls />
        <DocViewer.SearchButton />
        <DocViewer.DownloadButton />
      </DocViewer.Toolbar>
      <DocViewer.Search />
      <DocViewer.Main />
    </DocViewer.Root>
  );
}
`;

function Demo() {
  return (
    <DocViewer.Root src={asset('sample.pdf')} size="sm" h={500}>
      <DocViewer.Toolbar subtitle="Draft 4">
        <DocViewer.PageControls />
        <DocViewer.ZoomControls />
        <DocViewer.SearchButton />
        <DocViewer.DownloadButton />
      </DocViewer.Toolbar>
      <DocViewer.Search />
      <DocViewer.Main />
    </DocViewer.Root>
  );
}

export const toolbar: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
