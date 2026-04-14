import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;
const API_KEY = process.env.EMAIL_BCKEND_SECRET_KEY!;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        console.log(queryString)
        const url = `${RENDER_URL}/api/tasks/fathom/meetings${queryString ? `?${queryString}` : ''}`


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
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to fetch meetings" },
            { status: 500 },
        );
    }
}
