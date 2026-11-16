import { MantineDemo } from '@mantinex/demo';
import { DocViewer } from 'mantine-doc-viewer';
import { asset } from './_assets';

const code = `
import { DocViewer } from 'mantine-doc-viewer';

function Demo() {
  return (
    <DocViewer
      src="/sample.pdf"
      size="md"
      color="grape"
      radius="xl"
      pageColorScheme="auto"
      defaultThumbnailsOpened
      styles={{
        toolbar: { borderBottomWidth: 2 },
        thumbnail: { borderRadius: 'var(--mantine-radius-md)' },
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
      size="md"
      color="grape"
      radius="xl"
      pageColorScheme="auto"
      defaultThumbnailsOpened
      styles={{
        toolbar: { borderBottomWidth: 2 },
        thumbnail: { borderRadius: 'var(--mantine-radius-md)' },
      }}
      h={440}
    />
  );
}

export const styles: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
