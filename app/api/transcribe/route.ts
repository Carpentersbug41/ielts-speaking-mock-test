import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { toFile } from 'openai/uploads'; // Import the toFile helper

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob | null;

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Sending audio to OpenAI for transcription...');

    // Convert the Blob to a File-like object suitable for the API using toFile
    // We need the ArrayBuffer for this.
    const audioBuffer = await audioBlob.arrayBuffer();
    // Dynamically determine the file extension from the mime type
    let extension = 'webm';
    let baseType = audioBlob.type.split(';')[0]; // Remove codecs info
    console.log('audioBlob.type:', audioBlob.type, 'baseType:', baseType);
    if (baseType) {
      if (baseType.includes('mp4')) extension = 'mp4';
      else if (baseType.includes('mpeg')) extension = 'mpeg';
      else if (baseType.includes('mpga')) extension = 'mpga';
      else if (baseType.includes('wav')) extension = 'wav';
      else if (baseType.includes('m4a')) extension = 'm4a';
      else if (baseType.includes('webm')) extension = 'webm';
    }
    const file = await toFile(Buffer.from(audioBuffer), `audio.${extension}`, {
        type: baseType,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    console.log('Transcription received:', transcription.text);

    return NextResponse.json({ transcript: transcription.text });

  } catch (error) {
    console.error('Transcription API error:', error);
    if (error instanceof Error) {
        // Use optional chaining for potentially nested properties
        const message = (error as any)?.error?.message || error.message;
        const status = (error as any)?.status || 500;
        return NextResponse.json({ error: `Transcription failed: ${message}` }, { status });
    } else {
        return NextResponse.json({ error: 'An unknown error occurred during transcription' }, { status: 500 });
    }
  }
} 