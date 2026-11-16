import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return <DocViewer src="/sample.pdf" h={500} />;
}
`;

function Demo() {
  return <DocViewer src={asset('sample.pdf')} h={500} />;
}

export const usage: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
