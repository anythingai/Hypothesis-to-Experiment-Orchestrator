import { NextResponse } from "next/server";

/**
 * Health check endpoint to verify the service is running
 * This endpoint is unprotected and can be used for monitoring
 */
export async function GET() {
  // Basic health check without external dependencies
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };
  return NextResponse.json(health);
} 