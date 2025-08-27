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

  useEffect(() => {
    const tm = setTimeout(() => {
      speakApi.speak(
        {
          text: 'who are you',
          expression: 'happy',
        },
        viewer
      );
    }, 2000);

    return () => clearTimeout(tm);
  }, []);

  const handleRecording = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
        event.preventDefault();
        if (recording) {
          stop();
          setRecording(false);
        } else {
          setRecording(true);
          await start(async (blob) => {});
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
