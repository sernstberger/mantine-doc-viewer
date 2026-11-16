import type { ComponentType } from 'react';
import { useDocViewerContext } from '../doc-viewer.context';
import type { DocViewerControl } from '../doc-viewer.types';
import { DocViewerDownloadButton } from '../DocViewerDownloadButton/DocViewerDownloadButton';
import { DocViewerFullscreenButton } from '../DocViewerFullscreenButton/DocViewerFullscreenButton';
import { DocViewerInfoButton } from '../DocViewerInfoButton/DocViewerInfoButton';
import { DocViewerLayoutMenu } from '../DocViewerLayoutMenu/DocViewerLayoutMenu';
import { DocViewerOutlineButton } from '../DocViewerOutlineButton/DocViewerOutlineButton';
import { DocViewerPageControls } from '../DocViewerPageControls/DocViewerPageControls';
import { DocViewerPresentationButton } from '../DocViewerPresentationButton/DocViewerPresentationButton';
import { DocViewerPrintButton } from '../DocViewerPrintButton/DocViewerPrintButton';
import { DocViewerRotateButton } from '../DocViewerRotateButton/DocViewerRotateButton';
import { useDocViewerExtensions } from '../DocViewerRoot/extensions-context';
import { DocViewerSearchButton } from '../DocViewerSearchButton/DocViewerSearchButton';
import { DocViewerThumbnailsButton } from '../DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import { DocViewerViewModeControl } from '../DocViewerViewModeControl/DocViewerViewModeControl';
import { DocViewerWrapButton } from '../DocViewerWrapButton/DocViewerWrapButton';
import { DocViewerZoomControls } from '../DocViewerZoomControls/DocViewerZoomControls';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import type { DocViewerType } from '../utils/get-doc-viewer-type';

type ControlsMap = Partial<Record<DocViewerControl, boolean>>;

const CONTROLS: Partial<Record<DocViewerType, [DocViewerControl, ComponentType][]>> = {
  pdf: [
    ['thumbnails', DocViewerThumbnailsButton],
    ['pages', DocViewerPageControls],
    ['zoom', DocViewerZoomControls],
    ['rotate', DocViewerRotateButton],
    ['layout', DocViewerLayoutMenu],
    ['outline', DocViewerOutlineButton],
    ['info', DocViewerInfoButton],
    ['presentation', DocViewerPresentationButton],
    ['search', DocViewerSearchButton],
  ],
  image: [
    ['zoom', DocViewerZoomControls],
    ['rotate', DocViewerRotateButton],
  ],
  text: [['wrap', DocViewerWrapButton]],
  code: [['viewMode', DocViewerViewModeControl]],
  markdown: [['viewMode', DocViewerViewModeControl]],
};

/** The controls of the document type, with the extensions' controls after their anchor controls, none while an extension screen is on */
export function DefaultControls({ controls }: { controls: ControlsMap | undefined }) {
  const { type, store } = useDocViewerContext();
  const extensions = useDocViewerExtensions();
  const reading = useDocViewerState(store, (state) => state.mode === 'read');
  const extra = extensions.flatMap((extension) => extension.toolbarControls ?? []);

  if (!reading) {
    return null;
  }

  return (CONTROLS[type] ?? []).flatMap(([control, Control]) => [
    controls?.[control] !== false && <Control key={control} />,
    ...extra
      .filter((item) => item.after === control && controls?.[item.control] !== false)
      .map((item) => <item.Component key={item.control} />),
  ]);
}

/** Print, download and full screen, the controls every toolbar ends with */
export function DefaultEndControls({ controls }: { controls: ControlsMap | undefined }) {
  const { store } = useDocViewerContext();
  const reading = useDocViewerState(store, (state) => state.mode === 'read');

  return (
    <>
      {reading && controls?.print !== false && <DocViewerPrintButton />}
      {controls?.download !== false && <DocViewerDownloadButton />}
      {controls?.fullscreen !== false && <DocViewerFullscreenButton />}
    </>
  );
}
