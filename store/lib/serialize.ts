/**
 * Recursively converts Prisma Decimal objects to plain JS numbers so data
 * can be safely passed from Server Components to Client Components.
 *
 * Prisma Decimal is NOT a plain object — Next.js will throw
 * "Only plain objects can be passed to Client Components" if you pass one.
 * JSON.parse(JSON.stringify()) converts Decimal to a string, not a number,
 * which breaks .toFixed(), arithmetic, and comparisons in the client.
 *
 * Usage: return <ClientComponent data={serialize(prismaResult)} />
 */
// Duck-type check for Prisma Decimal — works regardless of minification.
// Prisma's Decimal (based on decimal.js) always has s/e/d fields and toFixed.
function isDecimal(v: unknown): v is { toFixed(): string; toString(): string } {
  if (v === null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o["toFixed"] === "function" &&
    typeof o["toString"] === "function" &&
    typeof o["s"] === "number" &&   // sign
    typeof o["e"] === "number" &&   // exponent
    Array.isArray(o["d"])           // coefficient digits
  );
}

export function serialize<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(serialize) as unknown as T;
  }

  if (typeof value === "object") {
    // Prisma Decimal — convert to plain JS number
    if (isDecimal(value)) {
      return Number((value as { toString(): string }).toString()) as unknown as T;
    }

    // Date — convert to ISO string
    if (value instanceof Date) {
      return value.toISOString() as unknown as T;
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out as T;
  }

  return value;
}
