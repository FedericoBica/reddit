export type RelativeDateCopy = {
  dateLocale: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  justNow: string;
};

export type RelativeDateCopyInput = {
  dateLocale?: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  justNow?: string;
};

export function formatDateTime(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(dateStr: string, locale: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (mins < 60) return formatter.format(-mins, "minute");

  const hours = Math.floor(mins / 60);
  if (hours < 24) return formatter.format(-hours, "hour");

  return formatter.format(-Math.floor(hours / 24), "day");
}

export function formatRelativeAge(minutes: number, copy: RelativeDateCopy) {
  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return `${minutes}${copy.minutesAgo}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${copy.hoursAgo}`;

  return `${Math.floor(hours / 24)}${copy.daysAgo}`;
}

export function formatRelativeTimeFromCopy(dateStr: string, copy: RelativeDateCopy) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  return formatRelativeAge(mins, copy);
}

export function formatDateWithCopy(date: string, copy: Record<string, string>) {
  return formatDateTime(date, copy.dateLocale ?? "en");
}

export function formatRelativeAgeWithCopy(minutes: number, copy: Record<string, string>) {
  return formatRelativeAge(minutes, {
    dateLocale: copy.dateLocale ?? "en",
    minutesAgo: copy.minutesAgo,
    hoursAgo: copy.hoursAgo,
    daysAgo: copy.daysAgo,
    justNow: copy.justNow ?? "just now",
  });
}

export function formatRelativeWithCopy(dateStr: string, copy: Record<string, string>) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  return formatRelativeAgeWithCopy(mins, copy);
}
