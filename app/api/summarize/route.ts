import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';
import OpenAI from 'openai'; // Import OpenAI types for message params

/**
 * API route for generating a summary of chat messages using an LLM.
 * Adheres to SRP by focusing solely on summarization.
 *
 * @param req The NextRequest object containing the messages to summarize.
 * @returns NextResponse with the summary or an error.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Expecting an array of OpenAI ChatCompletionMessageParam to summarize
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = body.messages;

    // Input validation: Ensure messages array is present and not empty
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Summarize API Error: No messages provided for summarization or invalid format.');
      return NextResponse.json({ error: 'No messages provided for summarization' }, { status: 400 });
    }

    console.log('Summarize API: Received request to summarize chat history.');
    // Debug: Log the messages received by this API route
    console.log("--- Summarize API Debug: Messages Received for Summarization ---");
    console.log(JSON.stringify(messages, null, 2));
    console.log("---------------------------------------------------------");

    // Construct the full prompt for the LLM.
    // The system message guides the LLM on how to summarize.
    const summarizationPrompt: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant tasked with summarizing a conversation between a user and an examiner.
        Your goal is to create a concise, factual summary that captures the main topics discussed and key points made by both participants.
        This summary will be used to provide context to a language model for future turns in the conversation.
        Focus on retaining important details relevant to the ongoing dialogue.
        The summary should be a continuous paragraph, starting directly with the summary content.
        Do NOT include any introductory phrases like "Here is a summary:" or "The conversation discussed:".
        Do NOT add any conversational elements or questions. Just the summary.

        Example summary: "The user discussed their hobbies, mentioning a passion for painting and how it helps them relax. The examiner asked about their inspiration and the user shared details about nature as a muse."
        `
      },
      ...messages // Append the actual conversational messages to be summarized
    ];

    // Debug: Log the complete payload (system prompt + messages) being sent to OpenAI
    console.log("--- Summarize API Debug: Summarization Prompt Sent to OpenAI API ---");
    console.log(JSON.stringify(summarizationPrompt, null, 2));
    console.log("-------------------------------------------------------------");

    // Call OpenAI's chat completions API to get the summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 'gpt-3.5-turbo' is also a good, cheaper alternative for summarization
      messages: summarizationPrompt,
      temperature: 0.1, // Low temperature for factual, non-creative summarization
      max_tokens: 200, // Keep summaries concise to save tokens and fit context
    });

    // Debug: Log the raw completion response received from OpenAI
    console.log("--- Summarize API Debug: Raw Completion Response from OpenAI ---");
    console.log(JSON.stringify(completion, null, 2));
    console.log("--------------------------------------------------------");

    const summary = completion.choices[0]?.message?.content?.trim();

    // Check if the LLM returned a summary
    if (!summary) {
      console.error('Summarize API Error: LLM did not return a summary. Completion:', JSON.stringify(completion, null, 2));
      return NextResponse.json({ error: 'Failed to generate summary from LLM' }, { status: 500 });
    }

    console.log('Summarize API: Summary generated successfully:', summary);

    // Return the generated summary
    return NextResponse.json({ summary: summary });

  } catch (error) {
    console.error('Summarize API: Caught error:', error);
    if (error instanceof Error) {
        // Extract specific error message and status if available from OpenAI API errors
        const message = (error as any)?.error?.message || error.message;
        const status = (error as any)?.status || 500;
        console.error(`Summarize API: Error details - message: "${message}", status: ${status}`);
        return NextResponse.json({ error: `Summarize API failed: ${message}` }, { status });
    } else {
        // Catch-all for unexpected error types
        return NextResponse.json({ error: 'An unknown error occurred in Summarize API' }, { status: 500 });
    }
  }
}