import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = "idle" | "permission_pending" | "recording" | "stopped" | "error";

export interface UseMicResult {
  status: RecordingStatus;
  audioBlob: Blob | null;
  audioUrl: string | null; // For potential playback/debug
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  error: Error | null;
  isAudioApiSupported: boolean;
}

export function useMic(): UseMicResult {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Feature detection
  const isAudioApiSupported = typeof window !== 'undefined' &&
                               navigator.mediaDevices &&
                               typeof navigator.mediaDevices.getUserMedia === 'function' &&
                               typeof window.MediaRecorder !== 'undefined';

  const reset = useCallback(() => {
    setStatus("idle");
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    if (!isAudioApiSupported) {
      const errorMsg = "Audio recording is not supported in this browser.";
      console.error(errorMsg);
      setError(new Error(errorMsg));
      setStatus("error");
      return;
    }
    if (status === "recording") return;

    reset(); // Reset previous state
    setStatus("permission_pending");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("recording");
      mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm', // Explicitly set WebM as required
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const completeBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(completeBlob);
        setAudioUrl(URL.createObjectURL(completeBlob));
        setStatus("stopped");
        // Clean up the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        // Try to capture the specific error
        const recorderError = new Error(`MediaRecorder error: ${(event as any)?.error?.message || 'Unknown error'}`);
        setError(recorderError);
        setStatus("error");
         // Clean up the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();

    } catch (err) {
      console.error("Error getting media stream:", err);
      let errorMessage = "Failed to get microphone permission.";
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              errorMessage = "Microphone permission denied.";
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              errorMessage = "No microphone found.";
          } else {
              errorMessage = `Error accessing microphone: ${err.message}`;
          }
      }
      setError(new Error(errorMessage));
      setStatus("error");
    }
  }, [status, isAudioApiSupported, reset]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      // Status will be set to "stopped" by the onstop handler
    }
  }, [status]);

  return { status, audioBlob, audioUrl, startRecording, stopRecording, reset, error, isAudioApiSupported };
} 