import { wait } from '@/utils/wait';
import { Viewer } from '../vrm/viewer';
import { VRMExpressionPresetName } from '@pixiv/three-vrm';

const emotions = ['neutral', 'happy', 'angry', 'sad', 'relaxed'] as const;
export type EmotionType = (typeof emotions)[number] & VRMExpressionPresetName;

export type Screenplay = {
  text: string;
  language: string;
  expression: EmotionType;
};

const useSpeakApi = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  const continuousFetchAudio = (
    viewer: Viewer,
    expression: EmotionType,
    fetchInterval: number,
    fetchAudio: () => Promise<ArrayBuffer>,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < fetchInterval) {
        await wait(fetchInterval - (now - lastTime));
      }

      const buffer = await fetchAudio().catch(() => null);
      lastTime = Date.now();
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        onStart?.();
        if (!audioBuffer) {
          return;
        }
        return viewer.model?.speak(audioBuffer, expression);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };

  const getTtsAudio = (text: string) => async (): Promise<ArrayBuffer> => {
    const response = await fetch(`/api/pipeline_chat?text=${text}`);
    if (!response.ok) {
      throw new Error('Failed to fetch TTS audio');
    }
    return await response.arrayBuffer();
  };

  const speak = (
    expression: EmotionType,
    viewer: Viewer,
    text?: string,
    onStart?: () => void,
    onComplete?: () => void,
    getAudio?: () => Promise<ArrayBuffer>
  ) => {
    continuousFetchAudio(
      viewer,
      expression,
      0,
      getAudio ?? getTtsAudio(text!),
      onStart,
      onComplete
    );
  };

  return {
    speak,
  };
};

export default useSpeakApi;
