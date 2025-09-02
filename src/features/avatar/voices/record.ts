'use client';

import { useRef } from 'react';

const chunkDuration = 100;

const useRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const chunks = useRef<Blob[]>([]);

  async function start(onEnd: (audio: Blob) => Promise<void>) {
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.error('Failed to acquire wake lock:', err);
    }

    const audioContext = new window.AudioContext();
    analyserRef.current = audioContext.createAnalyser();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    analyserRef.current.fftSize = 256;

    microphoneRef.current = audioContext.createMediaStreamSource(stream);
    microphoneRef.current.connect(analyserRef.current);

    recorderRef.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    chunks.current = [];
    recorderRef.current.ondataavailable = async (e) => {
      await onEnd?.(e.data);
    };

    recorderRef.current.start(chunkDuration);
    mediaRecorderRef.current = recorderRef.current;
  }

  async function stop() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());

      mediaRecorderRef.current = null;
    }

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (e) {
        // ignore
      }
      wakeLockRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    chunks.current = [];
  }

  return { start, stop, analyserRef };
};

export default useRecorder;
