import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** What pages need to draw with the current layer visibility */
export interface PdfLayersState {
  config: OptionalContentConfig | null;
  version: number;
}

export interface PdfLayer {
  id: string;
  name: string;
  visible: boolean;
}

/** Layers listed in the document's optional content, with their current visibility */
export function getLayers(config: OptionalContentConfig | null): PdfLayer[] {
  if (!config) {
    return [];
  }

  // Groups know their own visibility; config.isVisible() takes marked content, not a group
  return Array.from(
    config as Iterable<[string, { name?: string; visible?: boolean }]>,
    ([id, group]) => ({
      id,
      name: group.name || id,
      visible: !!group.visible,
    })
  );
}

/**
 * Optional content (layers) of the document. `version` changes whenever a layer is shown or
 * hidden, so pages know to draw again
 */
export function usePdfLayers(document: PDFDocumentProxy | null) {
  const [config, setConfig] = useState<OptionalContentConfig | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!document) {
      return undefined;
    }

    let cancelled = false;
    document
      .getOptionalContentConfig()
      .then((loaded) => !cancelled && setConfig(loaded))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [document]);

  const setVisible = useCallback(
    (id: string, visible: boolean) => {
      config?.setVisibility(id, visible);
      setVersion((current) => current + 1);
    },
    [config]
  );

  const layers = useMemo(() => getLayers(config), [config, version]);

  return { config, layers, version, setVisible };
}
