import type { FC } from 'react';
import {
  ActionIcon,
  BoxProps,
  Button,
  CloseButton,
  CompoundStylesApiProps,
  Divider,
  ElementProps,
  factory,
  Factory,
  Toolbar,
  useProps,
} from '@mantine/core';
import { useDocViewerContext, useShowControl } from '../../doc-viewer.context';
import { DocViewerTooltip, useControlProps } from '../../DocViewerToolbar/DocViewerTooltip';
import { toolbarSoftDisabled } from '../../utils/a11y';
import { UndoIcon } from '../../utils/icons';
import {
  CloudIcon,
  EllipseIcon,
  HighlightIcon,
  PenIcon,
  RectangleIcon,
  SignatureIcon,
  TextBoxIcon,
} from '../markup-icons';
import classes from '../../DocViewer.module.css';
import { useMarkupContext } from '../markup-setup';
import type { DocViewerMarkupTool } from '../utils/markup';

const TOOL_ICONS: Record<DocViewerMarkupTool, FC> = {
  highlight: HighlightIcon,
  pen: PenIcon,
  text: TextBoxIcon,
  rectangle: RectangleIcon,
  ellipse: EllipseIcon,
  cloud: CloudIcon,
  signature: SignatureIcon,
};

export type DocViewerMarkupBarStylesNames =
  | 'markupBar'
  | 'markupDivider'
  | 'markupSave'
  | 'control';

export interface DocViewerMarkupBarProps
  extends BoxProps, CompoundStylesApiProps<DocViewerMarkupBarFactory>, ElementProps<'div'> {}

export type DocViewerMarkupBarFactory = Factory<{
  props: DocViewerMarkupBarProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerMarkupBarStylesNames;
  compound: true;
}>;

function logError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(error);
}

/**
 * The markup tools, undo and save, in a toolbar with one tab stop. Shown while markup is open or a
 * tool is picked; hidden with the `markup` control
 */
export const DocViewerMarkupBar = factory<DocViewerMarkupBarFactory>((_props) => {
  const { classNames, className, style, styles, vars, ...others } = useProps(
    'DocViewerMarkupBar',
    null,
    _props
  );
  const { getStyles, size, unstyled } = useDocViewerContext();
  const show = useShowControl();
  const controlProps = useControlProps();
  const context = useMarkupContext();
  if (!context || !show('markup') || !(context.opened || context.markup.tool !== null)) {
    return null;
  }

  const { markup, labels, save, setOpened } = context;
  const stylesApiProps = { classNames, styles };
  const control = (pressed?: boolean) => ({
    ...controlProps(pressed),
    ...getStyles('control', stylesApiProps),
  });
  const empty = markup.marks.length === 0;

  return (
    <Toolbar
      unstyled
      withBorder={false}
      aria-label={labels.markupLabel}
      {...getStyles('markupBar', { className, style, classNames, styles })}
      {...others}
    >
      {markup.tools.map((tool) => {
        const ToolIcon = TOOL_ICONS[tool];
        const active = markup.tool === tool;
        return (
          <DocViewerTooltip key={tool} label={labels.markupToolLabels[tool]}>
            <ActionIcon
              {...control(active)}
              aria-label={labels.markupToolLabels[tool]}
              aria-pressed={active}
              data-tool={tool}
              onClick={() => markup.setTool(active ? null : tool)}
            >
              <ToolIcon />
            </ActionIcon>
          </DocViewerTooltip>
        );
      })}
      <Divider
        unstyled={unstyled}
        orientation="vertical"
        {...getStyles('markupDivider', stylesApiProps)}
      />
      <DocViewerTooltip label={labels.undoMarkLabel}>
        <ActionIcon
          {...control()}
          aria-label={labels.undoMarkLabel}
          {...toolbarSoftDisabled(empty, markup.undo)}
        >
          <UndoIcon />
        </ActionIcon>
      </DocViewerTooltip>
      <Button
        unstyled={unstyled}
        size={size.input}
        variant="default"
        loading={markup.saving}
        {...getStyles('markupSave', stylesApiProps)}
        data-toolbar-toggle
        {...toolbarSoftDisabled(empty, () => save().catch(logError))}
      >
        {labels.saveMarkupLabel}
      </Button>
      <CloseButton
        unstyled={unstyled}
        {...getStyles('control', stylesApiProps)}
        size={size.control}
        aria-label={labels.closeMarkupLabel}
        data-toolbar-toggle
        onClick={() => {
          setOpened(false);
          markup.setTool(null);
        }}
      />
    </Toolbar>
  );
});

DocViewerMarkupBar.classes = classes;
DocViewerMarkupBar.displayName = 'mantine-doc-viewer/DocViewerMarkupBar';
