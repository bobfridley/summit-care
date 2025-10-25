const g = globalThis as unknown as {
  Deno?: { env?: { get?: (k: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

export function env(key: string): string | undefined {
  return g?.Deno?.env?.get?.(key) ?? g?.process?.env?.[key];
}
