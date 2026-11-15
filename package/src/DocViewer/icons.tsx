import React from 'react';

type IconProps = React.ComponentPropsWithoutRef<'svg'>;

function Icon({ children, ...others }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...others}
    >
      {children}
    </svg>
  );
}

export const MinusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const FitWidthIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3M4 5v14M20 5v14" />
  </Icon>
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 15l6-6 6 6" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Icon>
);

export const FitScreenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
  </Icon>
);

export const RotateIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </Icon>
);

export const SidebarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Icon>
);

export const PanelPositionIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 15h18M7 18h2M11 18h2M15 18h2" />
  </Icon>
);

export const WrapIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4M4 18h5M15 16l-2 2 2 2" />
  </Icon>
);

export const PrintIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </Icon>
);

export const FullscreenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Icon>
);

export const FullscreenExitIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </Icon>
);

export const OutlineIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </Icon>
);

export const TwoPagesIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="8" height="16" rx="1" />
    <rect x="13" y="4" width="8" height="16" rx="1" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

export const PresentationIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="12" rx="1" />
    <path d="M12 16v4M8 20h8M10 8l4 2-4 2z" />
  </Icon>
);

export const EditPagesIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="9" rx="1" />
    <path d="M3 17h18M3 21h12" />
  </Icon>
);

export const DragHandleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Icon>
);

export const MarkupIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" />
  </Icon>
);

export const HighlightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 14l-3 3v3h3l3-3M9 14l7-9 3 3-7 9M9 14l3 3M4 21h16" />
  </Icon>
);

export const PenIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 17c3-4 5 2 8-2s4-8 7-6-3 9 3 9" />
  </Icon>
);

export const TextBoxIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M8 9h8M12 9v7" />
  </Icon>
);

export const RectangleIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="6" width="16" height="12" rx="1" />
  </Icon>
);

export const EllipseIcon = (props: IconProps) => (
  <Icon {...props}>
    <ellipse cx="12" cy="12" rx="9" ry="7" />
  </Icon>
);

export const CloudIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 18a3 3 0 0 1-1-5.8A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6 2.5A3 3 0 0 1 17 18z" />
  </Icon>
);

export const SignatureIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 16c2-6 4-9 5-8s-2 8 0 8 3-5 4-5 0 4 2 4 2-2 3-2M3 20h18" />
  </Icon>
);

export const UndoIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
  </Icon>
);
