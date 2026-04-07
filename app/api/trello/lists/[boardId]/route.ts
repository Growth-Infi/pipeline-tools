import { NextResponse, NextRequest } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await context.params;

  try {
    const res = await fetch(
      `${RENDER_URL}/api/tasks/trello/boards/${boardId}/lists`,
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 500 },
    );
  }
}
