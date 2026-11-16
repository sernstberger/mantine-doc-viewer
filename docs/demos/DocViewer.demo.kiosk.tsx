import { Stack, Text } from '@mantine/core';
import { useIdle, useInterval } from '@mantine/hooks';
import { MantineDemo } from '@mantinex/demo';
import { DocViewer, useDocViewer } from 'mantine-doc-viewer';
import { useEffect } from 'react';
import { asset } from './_assets';

const code = `
import { Stack, Text } from '@mantine/core';
import { useIdle, useInterval } from '@mantine/hooks';
import { DocViewer, useDocViewer } from 'mantine-doc-viewer';

function Demo() {
  const [store, viewer] = useDocViewer();

  // initialState: false, the default (true) would start the loop as soon as the page mounts
  const idle = useIdle(8_000, { initialState: false });
  const attract = useInterval(() => viewer.nextSpread({ loop: true }), 3_000);

  useEffect(() => {
    if (idle) {
      viewer.goToPage(1);
      viewer.setZoom('fit-page');
      attract.start();
    } else {
      attract.stop();
    }
    return attract.stop;
  }, [idle]);

  return (
    <Stack>
      <Text size="sm">
        {idle ? 'Idle: turning pages by itself' : 'Leave it alone for 8 seconds, or touch it to stop'}
      </Text>
      <DocViewer src="/sample.pdf" store={store} h={400} />
    </Stack>
  );
}
`;

function Demo() {
  const [store, viewer] = useDocViewer();

  const idle = useIdle(8_000, { initialState: false });
  const attract = useInterval(() => viewer.nextSpread({ loop: true }), 3_000);

  useEffect(() => {
    if (idle) {
      viewer.goToPage(1);
      viewer.setZoom('fit-page');
      attract.start();
    } else {
      attract.stop();
    }
    return attract.stop;
  }, [idle]);

  return (
    <Stack>
      <Text size="sm">
        {idle
          ? 'Idle: turning pages by itself'
          : 'Leave it alone for 8 seconds, or touch it to stop'}
      </Text>
      <DocViewer src={asset('sample.pdf')} store={store} h={400} />
    </Stack>
  );
}

export const kiosk: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
