/** A value that survives a JSON round trip unchanged. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

/** Deep copy of JSON-shaped data. Records are copied on the way in and out of a table so callers never share state with it. */
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Serialises with object keys in sorted order, so two values that differ only
 * in key order produce the same text. Array order is kept: it carries meaning.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/** Structural equality on JSON-shaped data, ignoring object key order. */
export function jsonEquals(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry !== undefined) {
        sorted[key] = sortKeys(entry);
      }
    }
    return sorted;
  }
  return value;
}
