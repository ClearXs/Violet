'use client';

import { useRef } from 'react';

const useRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start(onEnd: (audio: Blob) => Promise<void>) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    chunks.current = [];
    recorder.ondataavailable = async (e) => {
      await onEnd?.(e.data);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }

  return { start, stop };
};

export default useRecorder;
