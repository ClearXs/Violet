import VrmViewer, { VrmViewerProps } from '@/features/avatar/vrmViewer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Viewer } from './vrm/viewer';
import { ViewerContext } from './vrm/viewerContext';
import useSpeakApi from './voices/speak';
import useRecorder from './voices/record';
import LiveKit from './voices/livekit';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

export type AvatarProps = VrmViewerProps & {};

export default function Avatar(props: AvatarProps) {
  const viewer = useMemo(() => new Viewer(), []);
  const speakApi = useSpeakApi();
  const liveKit = useMemo<LiveKit>(
    () =>
      new LiveKit((bytes) => {
        speakApi.speak(
          'neutral',
          viewer,
          undefined,
          undefined,
          async () => bytes
        );
      }),
    []
  );
  const { start, stop } = useRecorder();
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    return () => {
      liveKit.close();
    };
  }, []);

  const sendVoice = useCallback(async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    liveKit.sendMessage(arrayBuffer);
  }, []);

  const handleRecording = useCallback(async () => {
    if (recording) {
      stop();
      setRecording(false);
    } else {
      setRecording(true);

      await start(async (blob) => {
        await sendVoice(blob);
      });
    }
  }, [recording, sendVoice, start, stop]);

  const handleKeyboard = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
        event.preventDefault();
        await handleRecording();
      }
    },
    [recording]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      viewer.unloadVRM();
    };
  }, [viewer]);

  return (
    <ViewerContext.Provider value={{ viewer }}>
      <VrmViewer {...props}></VrmViewer>

      <div className='absolute bottom-4 -translate-x-1/2 '>
        {recording ? (
          <IconMicrophone
            className='text-red-500'
            onClick={async () => await handleRecording()}
          />
        ) : (
          <IconMicrophoneOff
            className='text-red-500'
            onClick={async () => await handleRecording()}
          />
        )}
      </div>
    </ViewerContext.Provider>
  );
}
