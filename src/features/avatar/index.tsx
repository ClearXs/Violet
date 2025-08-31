import VrmViewer, { VrmViewerProps } from '@/features/avatar/vrmViewer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Viewer } from './vrm/viewer';
import { ViewerContext } from './vrm/viewerContext';
import useSpeakApi from './voices/speak';
import useRecorder from './voices/record';
import useLiveKit from './voices/livekit';
import LiveKit from './voices/livekit';

export type AvatarProps = VrmViewerProps & {};

export default function Avatar(props: AvatarProps) {
  const viewer = useMemo(() => new Viewer(), []);
  const speakApi = useSpeakApi();
  const liveKitRef = useRef<LiveKit>(null);
  const { start, stop } = useRecorder();
  const [recording, setRecording] = useState(false);

  const handleHumanVoice = useCallback(
    async (blob: Blob) => {
      try {
        const { text, language } = await doRecognizeVoice(blob);

        speakApi.speak({ text, language, expression: 'neutral' }, viewer);
      } catch (error) {}
    },
    [viewer]
  );

  // recognize voice data
  const doRecognizeVoice = useCallback(
    (blob: Blob): Promise<{ text: string; language: string }> => {
      return fetch('/api/voice/asr/raw', {
        method: 'POST',
        body: blob,
        headers: {
          'Content-Type': 'audio/webm',
        },
      }).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to recognize voice');
        }
        return response.json();
      });
    },
    [viewer]
  );

  const handleRecording = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
        event.preventDefault();
        if (recording) {
          stop();
          setRecording(false);
        } else {
          setRecording(true);

          await start(async (blob) => {
            await handleHumanVoice(blob);
          });
        }
      }
    },
    [recording]
  );

  const onReceiveAudio = useCallback((audioArray: ArrayBuffer) => {}, []);

  useEffect(() => {
    window.addEventListener('keydown', handleRecording);

    liveKitRef.current = new LiveKit(onReceiveAudio);

    liveKitRef.current.setup();

    return () => {
      window.removeEventListener('keydown', handleRecording);
      viewer.unloadVRM();
      liveKitRef.current?.close();
    };
  }, [handleRecording]);

  return (
    <ViewerContext.Provider value={{ viewer }}>
      <VrmViewer {...props}></VrmViewer>
    </ViewerContext.Provider>
  );
}
