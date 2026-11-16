import { createContext, createElement, type ReactNode, use, useRef } from 'react';
import type { DocViewerExtension } from '../doc-viewer.types';

const DocViewerExtensionsContext = createContext<readonly DocViewerExtension[]>([]);
const DocViewerExtensionOptionsContext = createContext<readonly DocViewerExtension[]>([]);

const NO_EXTENSIONS: readonly DocViewerExtension[] = [];

function getSlots(extension: DocViewerExtension) {
  return [
    extension.name,
    extension.setup,
    extension.bar,
    extension.pageLayer,
    extension.thumbnail?.action,
    extension.screen?.mode,
    extension.screen?.Component,
    ...(extension.toolbarControls ?? []).flatMap((item) => [
      item.control,
      item.after,
      item.Component,
    ]),
  ];
}

function sameItems(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * The extensions, the same array while their slots are the same. `create*Extension` is called
 * during render, so the app hands in new objects on every render; pages and thumbnails render the
 * slots and must not render again for that
 */
function useStableExtensions(extensions: readonly DocViewerExtension[]) {
  const slots = extensions.flatMap(getSlots);
  const stable = useRef({ slots, extensions });
  if (!sameItems(stable.current.slots, slots)) {
    stable.current = { slots, extensions };
  }
  return stable.current.extensions;
}

/** Provides the extensions of a Root: their slots, and their latest options */
export function DocViewerExtensionsProvider({
  extensions = NO_EXTENSIONS,
  children,
}: {
  extensions: readonly DocViewerExtension[] | undefined;
  children: ReactNode;
}) {
  const stable = useStableExtensions(extensions);
  return createElement(
    DocViewerExtensionsContext,
    { value: stable },
    createElement(DocViewerExtensionOptionsContext, { value: extensions }, children)
  );
}

/** The extensions of the viewer, for their slots. The same array while the slots are the same */
export function useDocViewerExtensions() {
  return use(DocViewerExtensionsContext);
}

/** The options of the extension with this name, undefined when it is not in `extensions` */
export function useDocViewerExtensionOptions<T>(name: string) {
  return use(DocViewerExtensionOptionsContext).find((extension) => extension.name === name)
    ?.options as T | undefined;
}
