import { useContext, useCallback } from 'react';
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation';
import { ViewerContext } from './vrm/viewerContext';
import { Model } from '@/features/avatar/vrm/model';

export type Motion = {
  idle_loop: string;
};

export type VrmViewerProps = {
  // available vrm model download path
  vrm: string;
  // available motions
  motion: Motion;
};

export default function VrmViewer({ vrm, motion }: VrmViewerProps) {
  const { viewer } = useContext(ViewerContext);

  const loadIdleAnimation = useCallback(
    async (model: Model) => {
      const vrma = await loadVRMAnimation(motion.idle_loop);
      if (vrma) model.loadAnimation(vrma);
    },
    [viewer]
  );

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        viewer.loadVrm(vrm, loadIdleAnimation);

        // Drag and DropでVRMを差し替え
        canvas.addEventListener('dragover', function (event) {
          event.preventDefault();
        });

        canvas.addEventListener('drop', function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }

          const file_type = file.name.split('.').pop();

          if (file_type === 'vrm') {
            const blob = new Blob([file], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);

            viewer.loadVrm(url, loadIdleAnimation);
          }
        });
      }
    },
    [viewer]
  );

  return <canvas ref={canvasRef} className={'h-full w-full'}></canvas>;
}
