'use client';

import { useRef } from 'react';

const useRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start(onEnd: (audio: Blob) => Promise<void>) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const recorder = new MediaRecorder(stream);

    chunks.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      await onEnd?.(blob);
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
