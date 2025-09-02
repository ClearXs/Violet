import VrmViewer, { VrmViewerProps } from '@/features/avatar/VrmViewer';
import { useEffect, useMemo } from 'react';
import { Viewer } from './vrm/viewer';
import { ViewerContext } from './vrm/viewerContext';
import useSpeakApi from './voices/speak';
import LiveKit from './voices/livekit';
import Tools from './Tools';
import Subtitles from './Subtitle';

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

  useEffect(() => {
    return () => {
      liveKit.close();
      viewer.unloadVRM();
    };
  }, []);

  return (
    <ViewerContext.Provider value={{ viewer }}>
      <VrmViewer {...props}></VrmViewer>

      <div className='absolute bottom-4 flex flex-col gap-2 left-1/2 -translate-x-1/2 '>
        <Subtitles maxLines={3} autoHide={true} autoHideDelay={5000} />
        <Tools liveKit={liveKit} />
      </div>
    </ViewerContext.Provider>
  );
}
