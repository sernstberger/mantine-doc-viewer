import type { ReactNode } from 'react';
import {
  Anchor,
  BoxProps,
  CompoundStylesApiProps,
  ElementProps,
  EmptyState,
  EmptyStateProps,
  factory,
  Factory,
  useProps,
} from '@mantine/core';
import { useDocViewerContext } from '../doc-viewer.context';
import classes from '../DocViewer.module.css';

export type DocViewerMessageStylesNames = 'empty';

export interface DocViewerMessageProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMessageFactory>, ElementProps<'div'> {
  /** Message content */
  children?: ReactNode;

  /** Adds a link that downloads the document */
  withDownload?: boolean;

  /** Announces the message straight away, for errors */
  error?: boolean;
}

export type DocViewerMessageFactory = Factory<{
  props: DocViewerMessageProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMessageStylesNames;
  compound: true;
}>;

/** Centered message inside the body, used for loading, errors and unsupported types */
export const DocViewerMessage = factory<DocViewerMessageFactory>((_props) => {
  const { classNames, className, style, styles, vars, children, withDownload, error, ...others } =
    useProps('DocViewerMessage', null, _props);
  const { getStyles, src, fileName, labels, unstyled } = useDocViewerContext();

  return (
    <EmptyState
      unstyled={unstyled}
      {...getStyles('empty', { className, style, classNames, styles })}
      size="sm"
      role={error ? 'alert' : 'status'}
      {...(others as EmptyStateProps)}
    >
      {children}
      {withDownload && (
        <EmptyState.Actions>
          <Anchor
            unstyled={unstyled}
            href={src}
            download={fileName ?? true}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            {labels.downloadFileLabel}
          </Anchor>
        </EmptyState.Actions>
      )}
    </EmptyState>
  );
});

DocViewerMessage.classes = classes;
DocViewerMessage.displayName = 'mantine-doc-viewer/DocViewerMessage';
