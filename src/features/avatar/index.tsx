import VrmViewer, { VrmViewerProps } from '@/features/avatar/vrmViewer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Viewer } from './vrm/viewer';
import { ViewerContext } from './vrm/viewerContext';
import useSpeakApi from './voices/speak';
import useRecorder from './voices/record';

export type AvatarProps = VrmViewerProps & {};

export default function Avatar(props: AvatarProps) {
  const viewer = useMemo(() => new Viewer(), []);
  const speakApi = useSpeakApi();
  const { start, stop } = useRecorder();

  const [recording, setRecording] = useState(false);

  const handleHumanVoice = useCallback(async (blob: Blob) => {
    try {
      const { text, language } = await doRecognizeVoice(blob);
      debugger;

      // speakApi.speak({ text, language, expression: 'neutral' }, viewer);
    } catch (error) {}
  }, []);

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
    []
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

  useEffect(() => {
    window.addEventListener('keydown', handleRecording);
    return () => window.removeEventListener('keydown', handleRecording);
  }, [handleRecording]);

  return (
    <ViewerContext.Provider value={{ viewer }}>
      <VrmViewer {...props}></VrmViewer>
    </ViewerContext.Provider>
  );
}
