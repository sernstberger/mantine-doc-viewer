import { Table } from '@mantine/core';
import React from 'react';

export interface DataTableProps {
  /** Column headings */
  head: string[];

  /** One array of cells per row. Cells are rendered as they are: use `<code>` for code, backticks are shown as typed */
  data: React.ReactNode[][];
}

/** Table for mdx pages, which have no Markdown pipe tables */
export function DataTable({ head, data }: DataTableProps) {
  return (
    <Table.ScrollContainer minWidth={560} mb="lg">
      <Table
        verticalSpacing="xs"
        data={{
          head,
          body: data.map((row) => row.map((cell, index) => <span key={index}>{cell}</span>)),
        }}
      />
    </Table.ScrollContainer>
  );
}
