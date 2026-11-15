/** Formats a number for the viewer's `locale`, the browser's language when it is not set */
export function formatNumber(value: number, locale?: string, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** A scale as a percentage: 1 is 100% */
export function formatPercent(scale: number, locale?: string) {
  return formatNumber(scale, locale, { style: 'percent', maximumFractionDigits: 0 });
}

/** A date and time for the viewer's `locale` */
export function formatDateTime(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
