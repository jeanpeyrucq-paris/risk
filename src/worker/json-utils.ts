export function toJsonArray(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(String));
  if (value === null || value === undefined) return '[]';
  return JSON.stringify([String(value)]);
}

export function fromJsonArray(text: string | null | undefined): string[] {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toBoolInt(value: unknown): number {
  return value ? 1 : 0;
}
