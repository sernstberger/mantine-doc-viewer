/**
 * Test harness for the toolbar parts: a Root around one part whose store is seeded with the state a
 * loaded document would give it, and whose registry holds the actions the views would register
 */
import React, { useEffect } from 'react';
import { DocViewer } from '../package/src/DocViewer';
import { DocViewerRoot } from '../package/src/DocViewerRoot/DocViewerRoot';
import { PdfSessionContext } from '../package/src/DocViewerRoot/pdf-session-context';
import {
  createDocViewerStore,
  updateDocViewerStateAction,
  type DocViewerState,
  type DocViewerStore,
} from '../package/src/doc-viewer.store';
import {
  getControllerRegistry,
  type ControllerImplementation,
} from '../package/src/hooks/use-controller-registry';

/** Options of `tests.itSupportsSystemProps` shared by the compound toolbar parts */
export const PART_TEST_OPTIONS = {
  stylesApiName: 'DocViewer',
  compound: true,
  providerStylesApi: false,
  styleProps: true,
  extend: true,
  variant: true,
  size: true,
  mod: true,
  classes: true,
  id: true,
  withProps: true,
} as const;

export interface PartHarnessOptions {
  src?: string;
  state?: Partial<DocViewerState>;
  actions?: ControllerImplementation;
  rootProps?: Record<string, unknown>;

  /** Renders the simple `DocViewer` with these props, which `toolbarControls` is a prop of */
  viewerProps?: Record<string, unknown>;

  /** A stand-in for the PDF session, for parts that need the loaded document */
  session?: object | null;
}

function Seed({ store, state }: { store: DocViewerStore; state: Partial<DocViewerState> }) {
  useEffect(() => {
    updateDocViewerStateAction(state, store);
  }, [store, state]);
  return null;
}

/** A component that renders `Part` in a Root, and the store of that Root */
export function createPartHarness<P extends object>(
  Part: React.ComponentType<P> & { extend?: unknown; classes?: unknown; withProps?: unknown },
  {
    src = '/files/report.pdf',
    state = {},
    actions = {},
    rootProps = {},
    viewerProps,
    session = null,
  }: PartHarnessOptions = {}
) {
  const store = createDocViewerStore();
  Object.assign(getControllerRegistry(store).current, actions);
  const seed = { status: 'ready' as const, ...state };

  function Harness(props: P) {
    const Viewer = viewerProps ? DocViewer : DocViewerRoot;
    return (
      <Viewer src={src} store={store} {...rootProps} {...viewerProps}>
        <Seed store={store} state={seed} />
        <PdfSessionContext value={session as never}>
          <Part {...props} />
        </PdfSessionContext>
      </Viewer>
    );
  }
  Harness.displayName = Part.displayName;
  Harness.extend = Part.extend;
  Harness.classes = Part.classes;
  Harness.withProps = Part.withProps;
  return { Harness, store };
}
