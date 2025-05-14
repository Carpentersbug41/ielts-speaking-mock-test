import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { PromptType } from '@/lib/interviewPrompts';
import OpenAI from 'openai';

// Define expected chat message structure from frontend
type HistoryMessage = {
  role: "user" | "examiner" | "assistant";
  content: string;
};

// Define the expected request body structure
interface AskApiRequestBody {
    prompt: PromptType;
    history: HistoryMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body: AskApiRequestBody = await req.json();
    const currentPrompt: PromptType = body.prompt;
    const history: HistoryMessage[] = body.history || [];

    // Validate the received prompt object (basic check)
    if (!currentPrompt || typeof currentPrompt.prompt_text !== 'string') {
      return NextResponse.json({ error: `Invalid or missing prompt object in request body` }, { status: 400 });
    }
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: `Invalid history format: Expected an array` }, { status: 400 });
    }

    console.log("Asking LLM with received prompt and history...");

    // Construct messages array: System Prompt (from received prompt) + History
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: currentPrompt.prompt_text },
      ...history.map((msg): OpenAI.Chat.ChatCompletionMessageParam => ({
        role: msg.role === 'examiner' ? 'assistant' : msg.role,
        content: msg.content
      }))
    ];

    console.log("--- Messages Sent to OpenAI API ---");
    console.log(JSON.stringify(messages, null, 2));
    console.log("-----------------------------------");

    const completion = await openai.chat.completions.create({
      model: currentPrompt.model || 'gpt-4o-mini',
      messages: messages,
      temperature: currentPrompt.temperature ?? 0,
      max_tokens: 50, // Keep max tokens constrained
    });

    const question = completion.choices[0]?.message?.content?.trim();

    if (!question) {
      console.error('LLM did not return a question. Completion:', completion);
      return NextResponse.json({ error: 'Failed to generate question from LLM' }, { status: 500 });
    }

    console.log(`LLM returned question:`, question);

    return NextResponse.json({ question: question });

  } catch (error) {
    console.error('Ask API error:', error);
    if (error instanceof Error) {
        const message = (error as any)?.error?.message || error.message;
        const status = (error as any)?.status || 500;
        return NextResponse.json({ error: `Ask API failed: ${message}` }, { status });
    } else {
        return NextResponse.json({ error: 'An unknown error occurred in Ask API' }, { status: 500 });
    }
  }
} 