import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/lib/config';

const openai = new OpenAI({
    apiKey: config.genaiApiKey,
});

export const openaiModels = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", 'gpt-4.1-nano', "o4-mini", 'gpt-5', 'gpt-5-mini', 'gpt-5-nano']

export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'gpt-5-mini', max_tokens = 20, temperature = 0 } = await req.json();
        if (!openaiModels.includes(model)) {
            return NextResponse.json({ error: "Model not supported" }, { status: 404 })
        }

        console.log(JSON.stringify(response.output, null, 2)); // expands the [Array]
        return NextResponse.json({ result: response.output_text });
        const response = await openai.chat.completions.create({
            model,
            messages,
            max_completion_tokens: max_tokens,
        });
        return NextResponse.json({ result: response.choices[0].message.content?.trim() });
    } catch (e: any) {
        console.log(e)
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
