export function formatDate(value: string | Date) {
  return toDisplayStartDate(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | Date) {
  return toDisplayStartDate(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateRange(startsAt: string, endsAt: string) {
  const start = toDisplayStartDate(startsAt);
  const end = toDisplayEndDate(endsAt);
  const dateOnlyRange = isDateOnlyValue(startsAt) || isDateOnlyValue(endsAt);
  const sameDate = start.toDateString() === end.toDateString();

  if (dateOnlyRange) {
    return sameDate
      ? formatDate(start)
      : `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (sameDate) {
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

export function formatShiftTime(value: string) {
  if (value.includes("T")) {
    const date = new Date(value);
    return formatClockTime(date.getUTCHours(), date.getUTCMinutes());
  }
  const [hour = "0", minute = "0"] = value.split(":");
  return formatClockTime(Number(hour), Number(minute));
}

export function formatShiftRange(startsAt: string, endsAt: string) {
  return `${formatShiftTime(startsAt)} - ${formatShiftTime(endsAt)}`;
}

function toDisplayStartDate(value: string | Date) {
  return typeof value === "string"
    ? dateOnlyFromUtcMidnight(value) ?? new Date(value)
    : value;
}

function toDisplayEndDate(value: string | Date) {
  if (typeof value !== "string") return value;
  const dateOnly = dateOnlyFromUtcMidnight(value);
  if (!dateOnly) return new Date(value);
  dateOnly.setHours(23, 59, 59, 999);
  return dateOnly;
}

function isDateOnlyValue(value: string) {
  return Boolean(dateOnlyFromUtcMidnight(value));
}

function dateOnlyFromUtcMidnight(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/,
  );
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatClockTime(hour: number, minute: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(1970, 0, 1, hour, minute));
}
