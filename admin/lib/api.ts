/**
 * Shared helpers for the admin dashboard's cross-origin calls to the store API.
 *
 * Every admin page fetches from the store app on a different origin with
 * `credentials: "include"`. When that request can't complete (store down, wrong
 * NEXT_PUBLIC_STORE_URL, CORS), `fetch()` rejects with a TypeError
 * ("Failed to fetch"). Pages must catch it and call `describeFetchError` to show
 * a friendly, actionable message instead of crashing.
 */

export const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

/** Error carrying the HTTP status from a non-2xx store API response. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Fetch JSON from the store API with credentials. Throws `ApiError` on a non-2xx
 * response and a native `TypeError` on a network failure — both understood by
 * `describeFetchError`. Pass an absolute URL to bypass the STORE_API prefix.
 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${STORE_API}${path}`;
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.status === 401 || res.status === 403
        ? "Not authorized — sign in to the store as an admin, then retry."
        : `The store API responded with HTTP ${res.status}.`,
    );
  }
  return res.json() as Promise<T>;
}

/** Turn any thrown fetch error into a human-readable, actionable message. */
export function describeFetchError(err: unknown): string {
  // fetch() rejects with a TypeError when the request never completes
  // (unreachable host, DNS, connection refused, or a blocked CORS response).
  if (err instanceof TypeError) {
    return `Couldn't reach the store API at ${STORE_API}. Make sure the store app is running and NEXT_PUBLIC_STORE_URL points to it.`;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong loading this page. Please retry.";
}
