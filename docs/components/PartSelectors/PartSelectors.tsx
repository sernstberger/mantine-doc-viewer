import { Code } from '@mantine/core';
import React from 'react';
import { DataTable } from '../DataTable';
import { getComponentName } from '../PropsTable';

interface PartSelectorsProps {
  /** Selectors each part uses, by part name, from `part-selectors.json` */
  data: Record<string, string[]>;
}

/** Which Styles API selectors each part styles, read from the `StylesNames` type of the part by `scripts/docgen.ts` */
export function PartSelectors({ data }: PartSelectorsProps) {
  const rows = Object.entries(data)
    .filter(([, selectors]) => selectors.length > 0)
    .map(([part, selectors]) => [
      <Code key={part}>{getComponentName({ component: part, componentPrefix: 'DocViewer' })}</Code>,
      selectors.map((selector, index) => (
        <React.Fragment key={selector}>
          {index > 0 && ', '}
          <Code>{selector}</Code>
        </React.Fragment>
      )),
    ]);

  return <DataTable head={['Part', 'Selectors']} data={rows} />;
}
