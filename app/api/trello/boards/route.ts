import { NextResponse } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;

export async function GET() {
  try {
    const res = await fetch(`${RENDER_URL}/tasks/trello/boards`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 },
    );
  }
}
