import { useMemo } from 'react';
import { useMergedRef } from '@mantine/hooks';
import { useControllerRegistry, useRegisterController } from '../hooks/use-controller-registry';
import { detectDocType } from '../utils/get-doc-viewer-type';
import type { DocViewerProps } from './DocViewerRoot';
import { useIdleTimeout } from '../utils/kiosk';
import { DEFAULT_LABELS } from '../default-labels';
import { useControlledFullscreen } from '../hooks/use-controlled-fullscreen';
import { useShallowStable } from './use-shallow-stable';
import { useTapToggle } from '../hooks/use-tap-toggle';

function getFileName(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }

  const name = src.split(/[?#]/)[0].split('/').pop();
  return name ? decodeURIComponent(name) : undefined;
}

/** The type, file name, labels, idle and controller state, fullscreen and tap-toggle of one viewer */
export function useDocViewerSession(
  props: Pick<
    DocViewerProps,
    | 'src'
    | 'type'
    | 'mimeType'
    | 'fileName'
    | 'labels'
    | 'idleTimeout'
    | 'onIdle'
    | 'autoAdvance'
    | 'controllerRef'
    | 'tapToggleToolbar'
    | 'fullscreen'
    | 'onFullscreenChange'
  > & { ref?: React.Ref<HTMLDivElement> }
) {
  const { src, type, mimeType, fileName, labels, idleTimeout, autoAdvance } = props;
  const tapToggle = useTapToggle(props.tapToggleToolbar);
  const resolvedType = type ?? detectDocType({ src, mimeType, fileName });
  // Inline `labels={{ ... }}` is a new object on every render; the same texts keep the same labels
  const labelsProp = useShallowStable(labels);
  const resolvedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const idle = useIdleTimeout(idleTimeout, props.onIdle);
  const playing = autoAdvance && (idleTimeout === undefined || idle) ? autoAdvance : undefined;
  const controller = useControllerRegistry(props.controllerRef);
  const fullscreen = useControlledFullscreen(props.fullscreen, props.onFullscreenChange);
  const rootRef = useMergedRef(props.ref, fullscreen.ref);

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
    getType: () => resolvedType,
  });

  return {
    tapToggle,
    type: resolvedType,
    fileName: resolvedFileName,
    labels: resolvedLabels,
    playing,
    controller,
    fullscreen,
    rootRef,
  };
}
