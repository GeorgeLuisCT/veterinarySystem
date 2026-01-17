"use client";

const hasTimezone = (value: string) => /[zZ]|[+\-]\d{2}:?\d{2}$/.test(value);

export const normalizeToIsoString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  let candidate = trimmed.replace(" ", "T");
  if (!hasTimezone(candidate)) {
    candidate = `${candidate}${candidate.endsWith("Z") ? "" : "Z"}`;
  }

  let parsed = Date.parse(candidate);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  return new Date().toISOString();
};
