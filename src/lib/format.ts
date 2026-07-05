export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function dateToInputValue(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function inputValueToDate(value: string): number {
  return new Date(value + "T12:00:00").getTime();
}

export function formatMonthYear(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
