import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/lib/config';

const openai = new OpenAI({
    apiKey: config.genaiApiKey,
});

export const openaiModels = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", 'gpt-4.1-nano', "o4-mini"]

export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'gpt-4o-mini', max_tokens = 20, temperature = 0 } = await req.json();
        if (!openaiModels.includes(model)) {
            return NextResponse.json({ error: "Model not supported" }, { status: 404 })
        }
        const response = await openai.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature,
        });

        return NextResponse.json({ result: response.choices[0].message.content?.trim() });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
