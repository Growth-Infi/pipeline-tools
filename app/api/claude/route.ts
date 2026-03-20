import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import Anthropic from '@anthropic-ai/sdk';
import { claudeModels } from '@/lib/claudeModels';

const anthropic = new Anthropic({
    apiKey: config.claudeApiKey,
});



export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'claude-sonnet-4-6', max_tokens = 1000 } = await req.json();

        if (!claudeModels.includes(model)) {
            return NextResponse.json({ error: "Model not supported" }, { status: 404 });
        }

        const response = await anthropic.messages.create({
            model,
            max_tokens,
            system: messages[0].content,
            messages: messages.slice(1),
        });

        const block = response.content.find((b: any) => b.type === 'text');
        return NextResponse.json({ result: block?.text?.trim() ?? '' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}