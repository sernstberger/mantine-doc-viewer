import { renderHook, waitFor } from '@testing-library/react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { formatFileSize, useTextDocument } from './use-text-document';

describe('useTextDocument', () => {
  it('loads the text', async () => {
    mockFetch('hello world');
    const { result } = renderHook(() => useTextDocument('/notes.txt', 100));
    expect(result.current.status).toBe('loading');
    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        text: 'hello world',
        size: 11,
        mimeType: undefined,
      })
    );
  });

  it('refuses files larger than the limit from the content-length header', async () => {
    mockFetch('', { headers: { 'content-length': '5000' } });
    const { result } = renderHook(() => useTextDocument('/big.log', 100));
    await waitFor(() => expect(result.current).toEqual({ status: 'too-large', size: 5000 }));
  });

  it('refuses files larger than the limit when the size is not declared', async () => {
    mockFetch('x'.repeat(200));
    const { result } = renderHook(() => useTextDocument('/big.log', 100));
    await waitFor(() => expect(result.current).toEqual({ status: 'too-large', size: 200 }));
  });

  it('reports failed requests', async () => {
    mockFetch('Not found', { status: 404 });
    const { result } = renderHook(() => useTextDocument('/missing.txt', 100));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('formats file sizes', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
