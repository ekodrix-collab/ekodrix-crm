import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        status: "error",
        service: "unhealthy",
        database: "not_configured",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/app_health?id=eq.1&select=id&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: "no-store",
      }
    );

    const responseTime = Date.now() - startedAt;

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          service: "unhealthy",
          database: "disconnected",
          timestamp: new Date().toISOString(),
          responseTime,
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          service: "unhealthy",
          database: "health_table_missing",
          timestamp: new Date().toISOString(),
          responseTime,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      service: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      responseTime,
    });
  } catch (error) {
    const responseTime = Date.now() - startedAt;

    return NextResponse.json(
      {
        status: "error",
        service: "unhealthy",
        database: "error",
        timestamp: new Date().toISOString(),
        responseTime,
      },
      { status: 503 }
    );
  }
}
