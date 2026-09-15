import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

/**
 * Shared error shape for the org, treasury and payroll API routes.
 *
 * The existing payment routes each hand-roll their status mapping, which works
 * for one or two failure modes per route. The org-scoped routes have many more
 * (unauthenticated, not a member, wrong role, unknown org, invalid state
 * transition), so they raise `ApiError` and let one helper turn it into a
 * response — keeping a 403 from silently becoming a 500 in a route that forgot
 * a branch.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 400 — the request body or params did not validate. */
export function badRequest(message: string): ApiError {
  return new ApiError(message, 400);
}

/** 401 — no valid session cookie. */
export function unauthorized(message = 'Authentication required'): ApiError {
  return new ApiError(message, 401);
}

/** 403 — authenticated, but not permitted to act on this organization. */
export function forbidden(message = 'Not permitted'): ApiError {
  return new ApiError(message, 403);
}

/** 404 — the addressed resource does not exist, or is not visible to the caller. */
export function notFound(message = 'Not found'): ApiError {
  return new ApiError(message, 404);
}

/** 409 — the request is valid but conflicts with the resource's current state. */
export function conflict(message: string): ApiError {
  return new ApiError(message, 409);
}

/** Reads a JSON body, turning a malformed payload into a 400 rather than a 500. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
}

/**
 * Maps a thrown error to a response.
 *
 * `ApiError`s are expected control flow and are returned as-is without logging.
 * Anything else is unexpected, so it is logged and reported before being
 * flattened into a generic 500 — an internal message never reaches the client.
 */
export function errorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(`${fallbackMessage}:`, error);
  Sentry.captureException(error);

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
