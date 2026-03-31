import { NextResponse } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL;
const API_KEY = process.env.EMAIL_BCKEND_SECRET_KEY;

export async function POST(req: Request) {
  try {
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
      body: JSON.stringify(body),
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

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const response = await fetch(`${RENDER_URL}/job-status/${jobId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
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
