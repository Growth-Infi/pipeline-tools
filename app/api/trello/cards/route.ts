import { NextResponse } from 'next/server';

const RENDER_URL = process.env.EMAIL_PIPELINE_URL!;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await fetch(`${RENDER_URL}/api/tasks/trello/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to create cards' }, { status: 500 });
    }
}