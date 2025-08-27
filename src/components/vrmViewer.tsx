import { useContext, useCallback } from 'react';
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation';
import { ViewerContext } from '../features/vrmViewer/viewerContext';

export type Motion = {
  idle_loop: string;
};

export type VrmProps = {
  // available vrm model download path
  vrm: string;

  motion: Motion;
};

export default function VrmViewer({ vrm, motion }: VrmProps) {
  const { viewer } = useContext(ViewerContext);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        viewer.loadVrm(vrm);

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
            viewer.loadVrm(url, async (model) => {
              const vrma = await loadVRMAnimation(motion.idle_loop);
              if (vrma) model.loadAnimation(vrma);
            });
          }
        });
      }
    },
    [viewer]
  );

  return <canvas ref={canvasRef} className={'h-full w-full'}></canvas>;
}
