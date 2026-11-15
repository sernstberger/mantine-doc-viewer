import { DirectionProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockPdf } from '../../../../test-utils/mock-pdf';
import { centerOf, ITEM, mockItemLayout, pointerDrag } from '../../../../test-utils/pointer-drag';
import { DocViewer } from '../DocViewer';

const items = (listbox: HTMLElement) => within(listbox).getAllByRole('option');

async function openEditor(dir: 'ltr' | 'rtl') {
  mockPdf();
  render(
    <DirectionProvider initialDirection={dir} detectDirection={false}>
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" withPageEditing />
    </DirectionProvider>
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  const listbox = screen.getByRole('listbox', { name: 'Pages' });
  const order = () => items(listbox).map((option) => option.getAttribute('data-page'));
  return { listbox, order };
}

describe('drag to reorder pages in a right-to-left app', () => {
  let layout: jest.SpyInstance;
  afterEach(() => layout?.mockRestore());

  it('drops before a page on its right half, where the page starts', async () => {
    layout = mockItemLayout('grid', true);
    const { listbox, order } = await openEditor('rtl');
    const [x, y] = centerOf(items(listbox)[0]);

    const release = pointerDrag(items(listbox)[2], {
      path: [[x + ITEM.width / 2 - 5, y]],
      hold: true,
    });
    expect(items(listbox)[0]).toHaveAttribute('data-drop', 'before');
    release();
    expect(order()).toEqual(['3', '1', '2']);
  });

  it('drops after a page on its left half', async () => {
    layout = mockItemLayout('grid', true);
    const { listbox, order } = await openEditor('rtl');
    const [x, y] = centerOf(items(listbox)[0]);

    pointerDrag(items(listbox)[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['1', '3', '2']);
  });

  it('keeps reading the left half as "before" in a left-to-right app', async () => {
    layout = mockItemLayout('grid');
    const { listbox, order } = await openEditor('ltr');
    const [x, y] = centerOf(items(listbox)[0]);

    pointerDrag(items(listbox)[2], { path: [[x - ITEM.width / 2 + 5, y]] });
    expect(order()).toEqual(['3', '1', '2']);
  });
});
