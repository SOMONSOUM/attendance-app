export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
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
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDate = start.toDateString() === end.toDateString();

  if (sameDate) {
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

export function formatShiftTime(value: string) {
  const normalized = value.includes("T") ? value : `1970-01-01T${value}`;
  return formatTime(normalized);
}

export function formatShiftRange(startsAt: string, endsAt: string) {
  return `${formatShiftTime(startsAt)} - ${formatShiftTime(endsAt)}`;
}
