import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

export type ApiHandlerOptions<T = unknown> = {
  handler: () => Promise<T>;
  validation?: {
    schema: z.ZodType<any>;
    data: any;
  };
  cache?: {
    type: "public" | "private" | "no-store";
    maxAge?: number;
    staleWhileRevalidate?: number;
  };
  authRequired?: boolean;
};

/**
 * A utility for standardizing API route handlers
 * Provides consistent error handling, response formatting, and cache control
 */
export async function apiHandler<T>({
  handler,
  validation,
  cache = { type: "no-store" },
  authRequired = false,
}: ApiHandlerOptions<T>): Promise<NextResponse> {
  // Create a request ID for tracing
  const requestId = randomUUID();
  
  try {
    // Validate input data if schema is provided
    if (validation) {
      try {
        validation.schema.parse(validation.data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: "Validation error", 
              details: error.errors 
            },
            { 
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId
              }
            }
          );
        }
        throw error;
      }
    }

    // Handle the request
    const result = await handler();

    // Build cache control header
    let cacheControl: string;
    
    switch (cache.type) {
      case "public":
        cacheControl = `public, max-age=${cache.maxAge || 60}${
          cache.staleWhileRevalidate
            ? `, stale-while-revalidate=${cache.staleWhileRevalidate}`
            : ""
        }`;
        break;
      case "private":
        cacheControl = `private, max-age=${cache.maxAge || 0}`;
        break;
      case "no-store":
      default:
        cacheControl = "no-store, private";
        break;
    }

    // Return the successful response
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": cacheControl,
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error(`[API_ERROR][${requestId}]`, error);
    
    // Handle known error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId
          }
        }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId
          }
        }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId
        } 
      }
    );
  }
}

/**
 * Create paginated query parameters schema with sensible defaults
 */
export function createPaginationSchema(maxPerPage = 100) {
  return z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: "Page must be greater than 0" }),
    perPage: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= maxPerPage, {
        message: `perPage must be between 1 and ${maxPerPage}`,
      }),
  });
} 