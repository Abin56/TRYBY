import { NextResponse } from "next/server";

// API v1 root — health check + version info
export async function GET() {
  return NextResponse.json({
    api:     "TRYBY Mobile API",
    version: "v1",
    status:  "ok",
    endpoints: {
      auth:    "/api/v1/auth/{login,register,refresh,logout,me,biometric}",
      push:    "/api/v1/push/{register}",
      mobile:  "/api/v1/mobile/{home,products,cart,orders,search,notifications,devices,config}",
      deeplink: "/api/v1/deeplink",
    },
  });
}

// OPTIONS — CORS preflight for mobile clients
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Version",
      "Access-Control-Max-Age":       "86400",
    },
  });
}
