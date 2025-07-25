import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { PromptType } from '@/lib/interviewPrompts'; // Still imported for prompt structure
import OpenAI from 'openai'; // Import OpenAI for ChatCompletionMessageParam type

// Define expected chat message structure from frontend
// This now includes 'system' to account for summarization messages in llmContextMessages.
type HistoryMessage = {
  role: "user" | "examiner" | "assistant" | "system";
  content: string;
};

// Define the expected request body structure
interface AskApiRequestBody {
    prompt: PromptType;
    history: HistoryMessage[]; // This 'history' now directly receives llmContextMessages from page.tsx
}

/**
 * API route for generating the examiner's next question using an LLM.
 * Adheres to SRP by focusing solely on question generation.
 *
 * @param req The NextRequest object containing the prompt and chat history context.
 * @returns NextResponse with the generated question or an error.
 */
export async function POST(req: NextRequest) {
  try {
    const body: AskApiRequestBody = await req.json();
    const currentPrompt: PromptType = body.prompt;
    const history: HistoryMessage[] = body.history || []; // This now receives llmContextMessages from frontend

    // Validate the received prompt object (basic check)
    if (!currentPrompt || typeof currentPrompt.prompt_text !== 'string') {
      console.error(`Ask API: Validation Error - Invalid or missing prompt object in request body. Received: ${JSON.stringify(currentPrompt)}`);
      return NextResponse.json({ error: `Invalid or missing prompt object in request body` }, { status: 400 });
    }
    // Validate history format
    if (!Array.isArray(history)) {
      console.error(`Ask API: Validation Error - Invalid history format: Expected an array. Received: ${JSON.stringify(history)}`);
      return NextResponse.json({ error: `Invalid history format: Expected an array` }, { status: 400 });
    }

    console.log("Ask API: Received request for LLM question generation.");
    // Debug: Log basic info about the prompt received
    console.log(`Ask API: Current Prompt ID/Text Length: ${currentPrompt.prompt_text.length} chars`);

    // Construct messages array: System Prompt (from received prompt) + History from frontend
    // The history from frontend (`llmContextMessages`) will contain the SINGLE_PROMPT system message,
    // followed by the assistant summary message (if any), and then the recent conversational turns.
    // The mapping handles converting 'examiner' to 'assistant' for OpenAI API.
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map((msg): OpenAI.Chat.ChatCompletionMessageParam => ({
        role: msg.role === 'examiner' ? 'assistant' : msg.role, // Map 'examiner' to 'assistant', 'user' to 'user', 'system' to 'system'
        content: msg.content
    }));

    // Debug: Log the entire payload of messages being sent to OpenAI for question generation
    console.log("--- Ask API Debug: Messages Sent to OpenAI API ---");
    console.log(JSON.stringify(messages, null, 2));
    console.log("-------------------------------------------");

    // Call OpenAI's chat completions API
    const completion = await openai.chat.completions.create({
      model: currentPrompt.model || 'gpt-4o-mini', // Use model specified in prompt, fallback if not
      messages: messages,
      temperature: currentPrompt.temperature ?? 0, // Use temperature from prompt, fallback if not
    });

    // Debug: Log the entire raw completion response received from OpenAI
    console.log("--- Ask API Debug: Raw Completion Response from OpenAI ---");
    console.log(JSON.stringify(completion, null, 2));
    console.log("--------------------------------------------------");

    const question = completion.choices[0]?.message?.content?.trim();

    // Check if the LLM returned a question
    if (!question) {
      console.error('Ask API Error: LLM did not return a question. Completion:', JSON.stringify(completion, null, 2));
      return NextResponse.json({ error: 'Failed to generate question from LLM' }, { status: 500 });
    }

    console.log(`Ask API: LLM successfully returned question: "${question}"`);

    // Return the generated question
    return NextResponse.json({ question: question });

  } catch (error) {
    console.error('Ask API: Caught error:', error);
    if (error instanceof Error) {
        // Extract specific error message and status if available from OpenAI API errors
        const message = (error as any)?.error?.message || error.message;
        const status = (error as any)?.status || 500;
        console.error(`Ask API: Error details - message: "${message}", status: ${status}`);
        return NextResponse.json({ error: `Ask API failed: ${message}` }, { status });
    } else {
        // Catch-all for unexpected error types
        return NextResponse.json({ error: 'An unknown error occurred in Ask API' }, { status: 500 });
    }
  }
}