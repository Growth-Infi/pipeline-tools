<<<<<<< HEAD
import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";
=======

import { NextResponse } from 'next/server';
>>>>>>> da3626d (cursor added to fathom meeting)

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;
const API_KEY = process.env.EMAIL_BCKEND_SECRET_KEY!;

<<<<<<< HEAD
export async function GET() {
  try {
    console.log(API_KEY);
    const res = await fetch(`${RENDER_URL}/tasks/fathom/meetings`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
      },
    });
    const data = await res.json();
=======
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
>>>>>>> da3626d (cursor added to fathom meeting)

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 },
    );
  }
}
