import { NextResponse } from "next/server";

/**
 * Returns a successful JSON response.
 */
export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Returns a 201 Created JSON response.
 */
export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Returns a JSON error response.
 */
export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Returns a 400 Bad Request response.
 */
export function badRequest(message: string) {
  return jsonError(message, 400);
}

/**
 * Returns a 404 Not Found response.
 */
export function notFound(entity: string) {
  return jsonError(`${entity} not found`, 404);
}

/**
 * Returns a 500 Internal Server Error response with logging.
 */
export function serverError(error: unknown, context: string) {
  console.error(`${context}:`, error);
  const message = error instanceof Error ? error.message : `Failed to ${context.toLowerCase()}`;
  return jsonError(message, 500);
}
