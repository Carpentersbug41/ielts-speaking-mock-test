import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const textToSpeak: string = body.text;

    if (!textToSpeak) {
      return NextResponse.json({ error: 'No text provided to speak' }, { status: 400 });
    }

    console.log(`Generating speech for text: "${textToSpeak}"...`);

    // Use the specified TTS model and voice
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: textToSpeak,
      response_format: "mp3",
    });

    console.log('Speech generated successfully.');

    // Check if response body is null or undefined
    if (!mp3Response.body) {
        throw new Error("OpenAI TTS API returned an empty response body.");
    }

    // Return the audio stream directly
    // Set appropriate headers for audio streaming
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Disposition', 'inline; filename="speech.mp3"'); // Suggest filename

    return new NextResponse(mp3Response.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Speak API error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Speak API failed: ${error.message}` }, { status: 500 });
    } else {
        return NextResponse.json({ error: 'An unknown error occurred in Speak API' }, { status: 500 });
    }
  }
} 