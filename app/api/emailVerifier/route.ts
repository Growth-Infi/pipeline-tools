import { createServerClient } from "@supabase/ssr";
import { log } from "console";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL;
const API_KEY = process.env.EMAIL_BCKEND_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("USer from nextjs cookies ", user);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RENDER_URL || !API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const response = await fetch(`${RENDER_URL}/start-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        ...body,
        userId: user.id,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy POST Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    if (!RENDER_URL || !API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 },
      );
    }
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (!jobId)
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    if (!API_KEY) {
    }
    const response = await fetch(`${RENDER_URL}/job-status/${jobId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY!,
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 },
    );
  }
}
