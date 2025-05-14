"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMic, RecordingStatus } from './hooks/useMic'; // Corrected relative path
import { PromptType, TOPIC_PROMPT_SETS, getAvailableTopics } from '@/lib/interviewPrompts';
import { RubricResult } from '@/lib/rubricPrompts'; // Assuming lib is adjacent
import { Mic } from 'lucide-react'; // Import the Mic icon
import ReactMarkdown from 'react-markdown';

// Define the states for our application flow
type AppState =
  | "idle"          // Ready to start or waiting for next turn
  | "recording"     // User is speaking
  | "transcribing"  // Sending audio, waiting for transcript
  | "asking"        // Sending turn info, waiting for AI question
  | "speaking"      // AI question received, sending for TTS, waiting for audio
  | "playing"       // Playing AI audio
  | "finished"      // Interview complete, ready to process feedback
  | "processing_feedback" // Calling pipeline API
  | "show_results"  // Displaying feedback
  | "error";        // An error occurred

type ChatMessage = {
  role: "user" | "examiner";
  content: string;
};

export default function Page() {
  const [isMounted, setIsMounted] = useState(false); // State to track client mount
  const [appState, setAppState] = useState<AppState>("idle");
  const [turn, setTurn] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [feedbackResults, setFeedbackResults] = useState<RubricResult[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(false); // State for chat visibility
  const [activePromptList, setActivePromptList] = useState<PromptType[] | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const { 
    status: micStatus, 
    audioBlob, 
    startRecording, 
    stopRecording, 
    reset: resetMic, 
    error: micError, 
    isAudioApiSupported 
  } = useMic();

  // Set mounted state only on client
  useEffect(() => {
    console.log("Component mounted, setting isMounted to true.");
    setIsMounted(true);
  }, []);

  // === API Call Functions ===

  const callTranscribeApi = useCallback(async (audioData: Blob) => {
    setAppState("transcribing");
    try {
      const formData = new FormData();
      formData.append('audio', audioData, 'audio.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Transcription API failed with status ${response.status}`);
      }

      const data = await response.json();
      const transcript = data.transcript;

      if (transcript) {
        setChatHistory(prev => [...prev, { role: 'user', content: transcript }]);
        setAppState("asking"); // Move to asking state after successful transcription
      } else {
        throw new Error("Transcription API returned empty transcript.");
      }

    } catch (err) {
      console.error("Transcription error:", err);
      setLastError(err instanceof Error ? err.message : "Transcription failed");
      setAppState("error");
    }
  }, []); // Empty dependency array for useCallback

  const callAskApi = useCallback(async (promptToSend: PromptType, currentChatHistory: ChatMessage[]) => {
    if (!promptToSend) {
      setLastError("Error: No active prompt found for this turn.");
      setAppState("error");
      return;
    }
    setAppState("asking");
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend, history: currentChatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ask API failed with status ${response.status}`);
      }

      const data = await response.json();
      const question = data.question;

      if (question) {
        setChatHistory(prev => [...prev, { role: 'examiner', content: question }]);
        setAppState("speaking");
      } else {
        throw new Error("Ask API returned empty question.");
      }

    } catch (err) {
      console.error("Ask API error:", err);
      setLastError(err instanceof Error ? err.message : "Failed to get question");
      setAppState("error");
    }
  }, []);

  const callSpeakApi = useCallback(async (text: string) => {
    setAppState("speaking");
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Speak API failed with status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const player = audioPlayerRef.current;
      if (player) {
        player.src = audioUrl;
        // Load the new audio source before playing
        player.load(); 
        // Attempt to play, and *then* set state to playing
        player.play()
          .then(() => {
            console.log("Audio playback started successfully.");
            setAppState("playing"); // Set state AFTER play starts
          })
          .catch(playError => {
            console.error("Audio playback error:", playError);
            setLastError("Failed to play examiner audio.");
            setAppState("error");
            // Clean up blob URL if play fails immediately
            URL.revokeObjectURL(audioUrl);
          });
      } else {
         throw new Error("Audio player reference not found.");
      }

    } catch (err) {
      console.error("Speak API error:", err);
      setLastError(err instanceof Error ? err.message : "Failed to generate speech");
      setAppState("error");
    }
  }, []);

  const callPipelineApi = useCallback(async () => {
    setAppState("processing_feedback");
    try {
      // Concatenate user responses from chat history
      const fullTranscript = chatHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n\n'); // Separate turns with double newline
        
      if (!fullTranscript) {
        throw new Error("Cannot process feedback: No user responses found in history.");
      }

      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Pipeline API failed with status ${response.status}`);
      }

      const data = await response.json();
      const feedback = data.feedback;

      if (feedback && Array.isArray(feedback)) {
        setFeedbackResults(feedback);
        setAppState("show_results");
      } else {
        throw new Error("Pipeline API returned invalid feedback format.");
      }

    } catch (err) {
      console.error("Pipeline API error:", err);
      setLastError(err instanceof Error ? err.message : "Failed to process feedback");
      setAppState("error");
    }
  }, [chatHistory]); // Depends on chatHistory

  // === Effect Hooks for State Transitions ===

  // Effect to handle mic status changes
  useEffect(() => {
    if (micStatus === 'stopped' && audioBlob) {
      callTranscribeApi(audioBlob);
    } else if (micStatus === 'error' && micError) {
      setLastError(`Microphone Error: ${micError.message}`);
      setAppState('error');
    }
    // Only trigger when micStatus or audioBlob changes relevantly
  }, [micStatus, audioBlob, micError, callTranscribeApi]); 

  // Effect to handle app state changes for API calls
  useEffect(() => {
    if (appState === 'asking') {
      const promptToSend = activePromptList?.[turn];
      if (promptToSend) {
          callAskApi(promptToSend, chatHistory);
      } else {
           setLastError(`Error: Could not find prompt for turn ${turn}.`);
           setAppState("error");
      }
    } else if (appState === 'speaking') {
      const lastExaminerMessage = chatHistory.findLast(msg => msg.role === 'examiner');
      if (lastExaminerMessage) {
        callSpeakApi(lastExaminerMessage.content);
      } else {
        setLastError("Cannot speak: No examiner question found.");
        setAppState("error");
      }
    } else if (appState === 'finished') {
        callPipelineApi();
    }
    // Dependencies based on state and necessary data for calls
  }, [appState, turn, chatHistory, activePromptList, callAskApi, callSpeakApi, callPipelineApi]);

  // Effect to handle audio playback ending
  useEffect(() => {
    const player = audioPlayerRef.current;
    
    // Define the handler function *inside* the effect
    const handleAudioEnd = () => {
      console.log("ENDED event fired. Current turn:", turn);
      // Check against the length of the *active* prompt list
      const maxTurns = activePromptList ? activePromptList.length : 6; // Default to 6 if list not set
      if (turn < maxTurns - 1) { 
        const nextTurn = turn + 1;
        console.log(`--> Setting turn to ${nextTurn} and state to idle`);
        setTurn(nextTurn);
        setAppState("idle");
      } else {
        console.log(`--> Setting state to finished after turn ${turn}`);
        setAppState("finished");
      }
    };

    if (player) {
      console.log("Binding 'ended' event listener for turn:", turn);
      player.addEventListener('ended', handleAudioEnd);
      
      // Cleanup function
      return () => {
        console.log("Cleaning up 'ended' event listener for turn:", turn);
        player.removeEventListener('ended', handleAudioEnd);
        // Revoke URL only if it's a blob URL and belongs to this instance
        if (player.src && player.src.startsWith('blob:')) {
          // Avoid revoking if src hasn't changed? Might be safer to let browser handle it
          // or manage URL lifecycle more carefully.
          // For now, let's revoke cautiously.
          // URL.revokeObjectURL(player.src); 
        }
      };
    }
  }, [turn, appState, activePromptList]); // Dependencies: re-bind if turn changes OR if appState becomes 'playing' (or relevant state)

  // Example handler for starting the process
  const handleMicPress = useCallback(() => {
    // Starting a completely NEW interview (Resetting to IDLE & Selecting Topic)
    if (appState === "idle" && turn === 0 || appState === "error" || appState === "show_results") {
        resetMic();
        setLastError(null);
        setChatHistory([]);
        setFeedbackResults([]);
        setTurn(0);

        // Randomly select a topic
        const topics = getAvailableTopics();
        if (topics.length === 0) {
            setLastError("Error: No prompt topics found!");
            setAppState("error");
            return;
        }
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const selectedPrompts = TOPIC_PROMPT_SETS[randomTopic];
        
        console.log(`Selected Topic: ${randomTopic}`);
        setActivePromptList(selectedPrompts); // Set the active prompts for this session
        setCurrentTopic(randomTopic); // Set topic name for display

        // Now transition to recording for the first turn (turn 0)
        setAppState("recording");
        startRecording();
    }
     // Starting recording for subsequent turns when IDLE
    else if (appState === "idle") { 
      resetMic();
      setLastError(null);
      setAppState("recording");
      startRecording();
    }
    // Stopping the current recording
    else if (appState === "recording") {
      setAppState("transcribing");
      stopRecording();
    }
  }, [appState, turn, resetMic, startRecording, stopRecording]);

  // Toggle chat visibility handler
  const toggleChatVisibility = () => {
    setIsChatVisible(prev => !prev);
  };

  // Render a basic loading or placeholder state until mounted
  if (!isMounted) {
    return (
       <div className="grow flex flex-col p-4 space-y-4 max-w-3xl mx-auto items-center justify-center">
         <h1 className="text-2xl font-bold">IELTS Speaking Mock Test v4</h1>
         <p>Loading...</p>
       </div>
    );
  }

  // Log state just before rendering main UI
  console.log("Rendering Page component, current appState:", appState);

  // Calculate maxTurns for button label logic
  const maxTurns = activePromptList ? activePromptList.length : 6;

  return (
    <>
      {/* Status Display - now outside the centered container */}
      <div className="w-full text-sm text-gray-500 text-center whitespace-nowrap">
        Status: {appState} | Mic Status: {micStatus} | Turn: {turn + 1} / {activePromptList?.length ?? 6}
        {!isAudioApiSupported && <p className="text-red-500">Audio Recording NOT Supported!</p>}
        {micError && <p className="text-red-500">Mic Error: {micError.message}</p>}
        {lastError && <p className="text-red-500">App Error: {lastError}</p>}
      </div>
      <div className="grow flex flex-col p-4 space-y-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">IELTS Speaking Mock Test v4</h1>
        {currentTopic && <h2 className="text-lg font-semibold">Topic: {currentTopic}</h2>}

        {/* Button to toggle chat history */}
        <button
          onClick={toggleChatVisibility}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded self-start"
        >
          {isChatVisible ? "Hide Transcript" : "Show Transcript"}
        </button>

        {/* Conditionally rendered Chat History */}
        {isChatVisible && (
          <div className="flex-grow border rounded p-2 h-96 overflow-y-auto space-y-2">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right ml-auto' : 'bg-gray-100 text-left mr-auto'} max-w-[80%]`}>
                <span className="font-bold">{msg.role === 'user' ? 'You' : 'Examiner'}</span>: {msg.content}
              </div>
            ))}
            {appState === 'transcribing' && <p className="text-center text-gray-500">Transcribing...</p>}
            {appState === 'asking' && <p className="text-center text-gray-500">Examiner is thinking...</p>}
            {appState === 'speaking' && <p className="text-center text-gray-500">Examiner is preparing to speak...</p>}
            {appState === 'processing_feedback' && <p className="text-center text-gray-500">Processing feedback...</p>}
          </div>
        )}

        {/* Microphone Button */}
        <button
          onClick={handleMicPress}
          disabled={!isAudioApiSupported || appState === 'transcribing' || appState === 'asking' || appState === 'speaking' || appState === 'playing' || appState === 'processing_feedback'}
          className={`w-[220px] h-[48px] px-4 py-3 rounded font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 ${ /* Color change based on recording state */
            appState === 'recording'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Mic className="h-5 w-5" /> {/* Add Mic icon */}
          <span className="whitespace-nowrap transition-all duration-200"> {/* Wrap text in span for layout */}
            {appState === 'recording' ? 'Stop Recording' : 
             (appState === 'idle' && turn === 0) ? 'Start Interview' : 
             (appState === 'idle' && turn > 0 && turn < maxTurns) ? `Record Answer (Turn ${turn + 1})` : 
             (appState === 'finished' && turn < maxTurns) ? `Record Answer (Turn ${turn + 1})` :
             (appState === 'show_results' || appState === 'error') ? 'Start New Interview' : 
             'Processing...'}
          </span>
        </button>

        {/* Audio Player (Hidden) */}
        <audio ref={audioPlayerRef} controls className="hidden"></audio>

        {/* Results Panel (Placeholder) */}
        {appState === 'show_results' && (
          <div className="border rounded p-4 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Feedback Results</h2>
            {feedbackResults.map((res, index) => (
              <div key={index} className="mb-3">
                {res.criterion === 'AEEC Introduction' ? (
                  <div dangerouslySetInnerHTML={{ __html: markdownToHtml(res.feedback) }} />
                ) : (
                  <>
                    <h3 className="font-bold">{res.criterion} - Band Score: {res.band_score > 0 ? res.band_score : 'N/A'}</h3>
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(res.feedback) }} />
                  </>
                )}
              </div>
            ))}
            <button 
              onClick={handleMicPress} // Now correctly resets to idle
              className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start New Interview
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function markdownToHtml(md: string) {
  // Use a very basic markdown-to-html conversion for line breaks and bold/italic
  return md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // italic
    .replace(/\n/g, '<br />'); // line breaks
}
