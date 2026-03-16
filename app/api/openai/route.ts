import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/lib/config';

const openai = new OpenAI({
    apiKey: config.genaiApiKey,
});

export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'gpt-4o-mini', max_tokens = 20 } = await req.json();

        const response = await openai.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature: 0,
        });

        return NextResponse.json({ result: response.choices[0].message.content?.trim() });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
