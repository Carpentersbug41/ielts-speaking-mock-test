# IELTS Speaking Mock Test App

This project provides a web-based application for practicing Part 1 of the IELTS Speaking test. It simulates an interaction with an AI examiner, provides text-to-speech for the examiner's questions, transcribes the candidate's responses, and offers AI-generated feedback based on IELTS scoring rubrics.

This application is built using Next.js and leverages OpenAI's API for:

*   **Speech-to-Text (STT):** `gpt-4o-mini`
*   **Question Generation (LLM):** `gpt-4o-mini`
*   **Text-to-Speech (TTS):** `gpt-4o-mini` (voice: "alloy")
*   **Rubric-Based Feedback (LLM):** `gpt-4o-mini`

It is based on the [Hume EVI Next.js Starter](https://github.com/HumeAI/hume-evi-next-js-starter) but significantly modified to use standard OpenAI APIs instead of Hume's specific Empathic Voice Interface.

## Features

*   Simulated 6-turn IELTS Speaking Part 1 interview.
*   Voice interaction: Record your answers using the microphone.
*   AI examiner questions delivered via Text-to-Speech.
*   Real-time transcription of your spoken responses.
*   Post-interview feedback based on Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and Pronunciation (inferred from text).
*   Estimated band scores (1-9) for each criterion.

## Getting Started

### Prerequisites

*   Node.js (version 18 or later recommended)
*   npm or pnpm
*   An OpenAI API Key

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url> ielts-speaking-mock-test
    cd ielts-speaking-mock-test
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # pnpm install
    ```

3.  **Configure Environment Variables:**
    *   Rename the `.env.example` file to `.env`.
    *   Open the `.env` file and add your OpenAI API key:
        ```env
        # OpenAI Credentials (Required for IELTS App)
        OPENAI_API_KEY=your_openai_api_key_here

        # Hume Credentials (Optional - Not used by this app)
        # HUME_API_KEY=
        # HUME_CLIENT_SECRET=
        ```

### Running the Development Server

```bash
npm run dev
# or
# pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

## How it Works

1.  The user clicks "Start Interview".
2.  The application uses the browser's `MediaRecorder` API to capture audio (WebM format).
3.  The audio Blob is sent to the `/api/transcribe` endpoint.
4.  The endpoint calls OpenAI's STT API (`gpt-4o-mini`) and returns the transcript.
5.  The transcript is displayed, and the frontend calls `/api/ask` with the current turn number.
6.  `/api/ask` fetches a predefined prompt for that turn and calls OpenAI's Chat Completions API (`gpt-4o-mini`) to generate the exact examiner question.
7.  The question text is returned and displayed.
8.  The frontend calls `/api/speak` with the question text.
9.  `/api/speak` calls OpenAI's TTS API (`gpt-4o-mini`, voice "alloy") and streams back MP3 audio.
10. The audio plays in the browser.
11. Steps 2-10 repeat for 6 turns.
12. After the 6th turn, the frontend calls `/api/pipeline` with the concatenated user transcript.
13. `/api/pipeline` iterates through 4 rubric prompts, calling the Chat Completions API (`gpt-4o-mini`) for each to evaluate the transcript based on IELTS criteria.
14. The aggregated feedback (band scores and paragraphs) is returned and displayed.

See `ARCHITECTURE.md` for more details.

## Cost

The primary cost is OpenAI API usage. See `COST.md` for an estimated breakdown.

## Deployment

This application is suitable for deployment on platforms like Vercel.

1.  Ensure your code is pushed to a Git repository (e.g., GitHub, GitLab).
2.  Import the project into Vercel.
3.  Configure the `OPENAI_API_KEY` environment variable in the Vercel project settings.
4.  Deploy!
