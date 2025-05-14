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
  const selectedMimeTypeRef = useRef<string>('');

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
      // Prefer audio/webm;codecs=opus for iOS 18.4+ and modern browsers
      let mimeType = '';
      const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
      const iOSVersionMatch = typeof navigator !== 'undefined' && navigator.userAgent.match(/OS (\d+)_?(\d+)?/);
      let iOSMajor = 0, iOSMinor = 0;
      if (isIOS && iOSVersionMatch) {
        iOSMajor = parseInt(iOSVersionMatch[1], 10);
        iOSMinor = iOSVersionMatch[2] ? parseInt(iOSVersionMatch[2], 10) : 0;
      }
      // iOS 18.4+ supports audio/webm;codecs=opus
      if (typeof MediaRecorder !== 'undefined') {
        if (
          MediaRecorder.isTypeSupported('audio/webm;codecs=opus') &&
          (!isIOS || (iOSMajor > 18 || (iOSMajor === 18 && iOSMinor >= 4)))
        ) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (isIOS && iOSMajor >= 14 && MediaRecorder.isTypeSupported('audio/mp4')) {
          // Fallback for iOS 14+ but <18.4
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
          mimeType = 'audio/mpeg';
        } else {
          mimeType = '';
        }
      }
      if (!mimeType && typeof MediaRecorder !== 'undefined') {
        setError(new Error('Sorry, your browser does not support audio recording for this app. If you are on iOS, please update to iOS 18.4 or later, or use a desktop/Android browser.'));
        setStatus('error');
        if (stream) stream.getTracks().forEach(track => track.stop());
        return;
      }
      selectedMimeTypeRef.current = mimeType;
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 100) { // Ignore empty or very small chunks
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Remove any leading empty or very short chunks
        while (audioChunksRef.current.length && audioChunksRef.current[0].size < 100) {
          audioChunksRef.current.shift();
        }
        const completeBlob = new Blob(audioChunksRef.current, selectedMimeTypeRef.current ? { type: selectedMimeTypeRef.current } : undefined);
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

      // Wait a microtask before starting the recording (iOS 18.4+ workaround)
      await Promise.resolve();
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