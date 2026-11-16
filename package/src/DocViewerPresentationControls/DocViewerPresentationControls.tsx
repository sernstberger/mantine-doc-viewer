import {
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import { docViewerActions } from '../doc-viewer.store';
import { PartStyles } from '../DocViewerPages/PartStyles';
import { useShallowStable } from '../DocViewerRoot/use-shallow-stable';
import { useDocViewerState } from '../hooks/use-doc-viewer-state';
import { PdfPresentationControls } from '../DocViewerPresentationControls/PdfPresentationControls';
import classes from '../DocViewer.module.css';

export type DocViewerPresentationControlsStylesNames =
  | 'presentationControls'
  | 'pageIndicator'
  | 'control';

export interface DocViewerPresentationControlsProps
  extends
    BoxProps,
    CompoundStylesApiProps<DocViewerPresentationControlsFactory>,
    ElementProps<'div'> {}

export type DocViewerPresentationControlsFactory = Factory<{
  props: DocViewerPresentationControlsProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerPresentationControlsStylesNames;
  compound: true;
}>;

/** Page count, previous and next page buttons and exit button shown while presenting */
export const DocViewerPresentationControls = factory<DocViewerPresentationControlsFactory>(
  (_props) => {
    const { classNames, className, style, styles, vars, ref, ...others } = useProps(
      'DocViewerPresentationControls',
      null,
      _props
    );
    const { store } = useDocViewerContext();
    const presenting = useDocViewerState(store, (state) => state.presenting);
    const page = useDocViewerState(store, (state) => state.page);
    const numPages = useDocViewerState(store, (state) => state.numPages);
    const stylesOptions = useShallowStable({ className, style });
    const elementProps = useShallowStable(others);
    if (!presenting) {
      return null;
    }

    return (
      <PartStyles classNames={classNames} styles={styles}>
        <PdfPresentationControls
          currentPage={page}
          numPages={numPages}
          onGoToPage={(target) => docViewerActions.goToPage(target, undefined, store)}
          onExit={() => docViewerActions.togglePresentation(store)}
          stylesOptions={stylesOptions}
          elementProps={elementProps}
          rootRef={ref}
        />
      </PartStyles>
    );
  }
);

DocViewerPresentationControls.classes = classes;
DocViewerPresentationControls.displayName = 'mantine-doc-viewer/DocViewerPresentationControls';
