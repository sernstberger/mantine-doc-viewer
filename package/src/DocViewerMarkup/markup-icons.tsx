import { Icon, type IconProps } from '../utils/icons';

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
