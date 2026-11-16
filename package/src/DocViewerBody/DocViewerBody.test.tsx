import { render, screen } from '@mantine-tests/core';
import { TestDocViewer } from '../../../test-utils/viewer';
import { useDocViewerContext as useContextValue } from '../doc-viewer.context';
import { useDocViewerContext } from '../hooks/view/use-doc-viewer-context';
import { DocViewerBody } from './DocViewerBody';

describe('mantine-doc-viewer/DocViewerBody', () => {
  it('renders a focusable region named after the document, or a plain body when not focusable', () => {
    function View() {
      const { title } = useDocViewerContext();
      return (
        <>
          <DocViewerBody data-testid="a" className="x">
            {title}
          </DocViewerBody>
          <DocViewerBody data-testid="b" focusable={false} />
        </>
      );
    }
    render(
      <TestDocViewer src="/files/doc.bin" fileName="doc.bin">
        <View />
      </TestDocViewer>
    );
    expect(screen.getByTestId('a')).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('a')).toHaveAttribute('aria-label', 'doc.bin');
    expect(screen.getByTestId('b')).not.toHaveAttribute('role');
  });

  it('throws outside a viewer', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useContextValue();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('DocViewer.Root component was not found in the tree');
    spy.mockRestore();
  });
});
