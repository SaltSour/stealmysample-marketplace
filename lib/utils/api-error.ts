import { NextResponse } from "next/server"
import { ZodError } from "zod"

// Error types that our API can return
export type ApiError = {
  code: string
  message: string
  details?: Record<string, any>
}

// Standard error codes
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

// Error response builder
export function createErrorResponse(
  error: ApiError | Error | ZodError,
  status: number = 500
): NextResponse {
  let apiError: ApiError

  if ((error as ApiError).code) {
    apiError = error as ApiError
  } else if (error instanceof ZodError) {
    apiError = {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Validation failed",
      details: error.flatten().fieldErrors,
    }
    status = 400
  } else {
    apiError = {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message || "An unexpected error occurred",
    }
  }

  // Log error details in development
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
      stack: (error as Error).stack,
    })
  }

  return NextResponse.json(apiError, { status })
}

// Helper functions for common error responses
export const apiErrors = {
  unauthorized: (message = "Unauthorized") =>
    createErrorResponse(
      { code: ErrorCodes.UNAUTHORIZED, message },
      401
    ),

  forbidden: (message = "Forbidden") =>
    createErrorResponse(
      { code: ErrorCodes.FORBIDDEN, message },
      403
    ),

  notFound: (message = "Not found") =>
    createErrorResponse(
      { code: ErrorCodes.NOT_FOUND, message },
      404
    ),

  validationError: (details: Record<string, any>) =>
    createErrorResponse(
      {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Validation failed",
        details,
      },
      400
    ),

  rateLimitExceeded: (message = "Too many requests") =>
    createErrorResponse(
      { code: ErrorCodes.RATE_LIMIT_EXCEEDED, message },
      429
    ),

  internal: (error: Error) =>
    createErrorResponse(error, 500),
}