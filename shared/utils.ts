// shared/utils.ts
// Simple cross-runtime helpers

export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  const d: Date = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
