import { useMemo } from 'react';
import { useMergedRef } from '@mantine/hooks';
import { useControllerRegistry, useRegisterController } from './controller';
import { detectDocType } from './detect-doc-type';
import type { DocViewerProps } from './DocViewer';
import { useIdleTimeout } from './kiosk';
import { DEFAULT_LABELS } from './labels';
import { useControlledFullscreen } from './use-controlled-fullscreen';
import { useTapToggle } from './use-tap-toggle';

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
  const resolvedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
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
