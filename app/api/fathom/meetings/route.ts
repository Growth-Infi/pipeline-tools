import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;
const API_KEY = process.env.EMAIL_BCKEND_SECRET_KEY!;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get("cursor");
        const url = `${RENDER_URL}/tasks/fathom/meetings${cursor ? `?cursor=${cursor}` : ''}`


        const res = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'x-api-key': API_KEY,
                },
            }
        );

        const data = await res.json();

        return NextResponse.json(data);
    } catch {
        throw new ApiError(500, "Failed to fetch meetings")
    }
}
