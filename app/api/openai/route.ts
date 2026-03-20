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

        const response = await openai.responses.create({
            model,
            instructions: messages[0].content,
            input: messages.slice(1),
        });

        const messageItem = response.output.find(
            (item): item is OpenAI.Responses.ResponseOutputMessage => item.type === 'message'
        );
        const textBlock = messageItem?.content.find(
            (block): block is OpenAI.Responses.ResponseOutputText => block.type === 'output_text'
        );
        const result = textBlock?.text.trim() ?? '';

        return NextResponse.json({ result });
    } catch (e: any) {
        console.log(e)
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}