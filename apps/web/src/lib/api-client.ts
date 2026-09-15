/**
 * Thin fetch wrapper for AfriWage's own API routes.
 *
 * Every org route answers with `{ message }` on failure, so one helper turns a
 * non-2xx into an `Error` carrying that message and the status. Without it each
 * call site re-implements the same `if (!response.ok)` dance and usually loses
 * the server's message, which is the only useful part.
 */

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  /** True when the caller needs to (re-)authenticate rather than retry. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ApiClientError(body.message ?? response.statusText, response.status);
  }

  return (await response.json()) as T;
}
