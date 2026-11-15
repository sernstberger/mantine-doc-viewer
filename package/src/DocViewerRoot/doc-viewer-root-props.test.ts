import { getRootProps } from './doc-viewer-root-props';

describe('getRootProps', () => {
  it('drops the props DocViewer reads itself and keeps the rest', () => {
    const props = {
      src: 'a.pdf',
      mod: 'x',
      onPageChange: () => {},
      id: 'viewer',
      'data-test': 'yes',
    };
    expect(getRootProps(props)).toEqual({ id: 'viewer', 'data-test': 'yes' });
  });
});
