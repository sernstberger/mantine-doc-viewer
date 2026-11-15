interface GetComponentNameInput {
  component: string;
  componentPrefix: string | undefined;
}

/** Parts of `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup`, not statics of `DocViewer` */
const SUBPATH_PART = /^DocViewer(PageEditor|Markup)/;

export function getComponentName({ component, componentPrefix }: GetComponentNameInput) {
  if (!componentPrefix || SUBPATH_PART.test(component)) {
    return component;
  }

  return componentPrefix === component
    ? component
    : `${componentPrefix}.${component.replace(componentPrefix, '')}`;
}
