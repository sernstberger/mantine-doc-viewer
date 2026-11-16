import {
  ActionIcon,
  CompoundStylesApiProps,
  factory,
  Factory,
  GetStylesApiOptions,
  Popover,
  useProps,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React from 'react';
import { useDocViewerContext, useShowControl } from '../doc-viewer.context';
import type { DocViewerControlProps } from '../doc-viewer.types';
import { docViewerActions } from '../doc-viewer.store';
import { PdfOutline, usePdfOutline } from '../DocViewerOutline/PdfOutline';
import { PartStyles } from '../DocViewerPages/PartStyles';
import { useReadyPdfSession } from '../DocViewerRoot/pdf-session-context';
import { DocViewerTooltip, useControlProps } from '../DocViewerToolbar/DocViewerTooltip';
import { OutlineIcon } from '../utils/icons';
import classes from '../DocViewer.module.css';

export type DocViewerOutlineButtonStylesNames =
  | 'control'
  | 'dropdown'
  | 'outline'
  | 'outlineList'
  | 'outlineItem';

export interface DocViewerOutlineButtonProps
  extends DocViewerControlProps, CompoundStylesApiProps<DocViewerOutlineButtonFactory> {}

export type DocViewerOutlineButtonFactory = Factory<{
  props: DocViewerOutlineButtonProps;
  ref: HTMLButtonElement;
  stylesNames: DocViewerOutlineButtonStylesNames;
  compound: true;
}>;

interface OutlinePopoverProps {
  document: PDFDocumentProxy;
  stylesApiProps: GetStylesApiOptions;
  buttonProps: Omit<
    DocViewerOutlineButtonProps,
    'classNames' | 'className' | 'style' | 'styles' | 'vars'
  >;
}

function OutlinePopover({ document, stylesApiProps, buttonProps }: OutlinePopoverProps) {
  const { store, getStyles, labels, unstyled } = useDocViewerContext();
  const controlProps = useControlProps();
  const outline = usePdfOutline(document);
  const [opened, popover] = useDisclosure(false);

  if (!outline || outline.length === 0) {
    return null;
  }

  return (
    <Popover
      unstyled={unstyled}
      opened={opened}
      onChange={popover.set}
      position="bottom-end"
      shadow="md"
      withinPortal={false}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <DocViewerTooltip label={labels.outlineLabel}>
          <ActionIcon
            {...controlProps(opened, stylesApiProps)}
            aria-label={labels.outlineLabel}
            aria-expanded={opened}
            {...buttonProps}
            onClick={(event) => {
              popover.toggle();
              buttonProps.onClick?.(event);
            }}
          >
            <OutlineIcon />
          </ActionIcon>
        </DocViewerTooltip>
      </Popover.Target>
      <Popover.Dropdown
        p={4}
        {...getStyles('dropdown', {
          classNames: stylesApiProps.classNames,
          styles: stylesApiProps.styles,
        })}
      >
        <PartStyles classNames={stylesApiProps.classNames} styles={stylesApiProps.styles}>
          <PdfOutline
            document={document}
            items={outline}
            onSelect={(page) => {
              popover.close();
              docViewerActions.goToPage(page, undefined, store);
            }}
          />
        </PartStyles>
      </Popover.Dropdown>
    </Popover>
  );
}

/** Opens the outline of a PDF in a popover, renders nothing when the PDF has no outline */
export const DocViewerOutlineButton = factory<DocViewerOutlineButtonFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerOutlineButton',
    null,
    _props
  );
  useDocViewerContext();
  const session = useReadyPdfSession();
  const show = useShowControl();

  if (!session || !show('outline')) {
    return null;
  }

  return (
    <OutlinePopover
      document={session.loaded.ready!.document}
      stylesApiProps={{ className, style, classNames, styles }}
      buttonProps={others}
    />
  );
});

DocViewerOutlineButton.classes = classes;
DocViewerOutlineButton.displayName = 'mantine-doc-viewer/DocViewerOutlineButton';
