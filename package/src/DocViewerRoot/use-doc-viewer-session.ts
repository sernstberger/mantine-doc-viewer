import { type Ref, useMemo } from 'react';
import { useMergedRef } from '@mantine/hooks';
import { DEFAULT_LABELS, mergeLabels, type DocViewerLabelsInput } from '../default-labels';
import type { DocViewerStore } from '../doc-viewer.store';
import { getControllerRegistry, useRegisterController } from '../hooks/use-controller-registry';
import { useControlledFullscreen } from '../hooks/use-controlled-fullscreen';
import { getDocViewerType, type DocViewerType } from '../utils/get-doc-viewer-type';
import { useShallowStable } from './use-shallow-stable';

function getFileName(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }

  const name = src.split(/[?#]/)[0].split('/').pop();
  return name ? decodeURIComponent(name) : undefined;
}

interface DocViewerSessionInput {
  src: string;
  type: DocViewerType | undefined;
  mimeType: string | undefined;
  fileName: string | undefined;
  labels: DocViewerLabelsInput | undefined;
  fullscreen: boolean | undefined;
  onFullscreenChange: ((fullscreen: boolean) => void) | undefined;
  ref: Ref<HTMLDivElement> | undefined;
  store: DocViewerStore;
}

/** The type, file name, labels, registry and full screen of one viewer */
export function useDocViewerSession(input: DocViewerSessionInput) {
  const { src, type, mimeType, fileName, store } = input;
  const resolvedType = type ?? getDocViewerType({ src, mimeType, fileName });
  const labelsProp = useShallowStable(input.labels);
  const resolvedLabels = useMemo(() => mergeLabels(DEFAULT_LABELS, labelsProp), [labelsProp]);
  const controller = getControllerRegistry(store);
  const fullscreen = useControlledFullscreen(input.fullscreen, input.onFullscreenChange);
  const rootRef = useMergedRef(input.ref, fullscreen.ref);

  const resolvedFileName = fileName ?? getFileName(src);
  useRegisterController(controller, {
    download: () => {
      const link = document.createElement('a');
      link.href = src;
      link.download = resolvedFileName ?? '';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    },
    toggleFullscreen: () => fullscreen.toggle(),
  });

  return {
    type: resolvedType,
    fileName: resolvedFileName,
    labels: resolvedLabels,
    controller,
    fullscreen,
    rootRef,
  };
}
