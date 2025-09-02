import { useCallback, useEffect, useRef, useState } from 'react';
import LiveKit from './voices/livekit';
import useRecorder from './voices/record';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

type ToolsProps = {
  liveKit: LiveKit;
};

export default function Tools({ liveKit }: ToolsProps) {
  const { start, stop, analyserRef } = useRecorder();
  const [recording, setRecording] = useState(false);

  const waveCanvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const waveRenderRef = useRef<CanvasRenderingContext2D | undefined>(null);

  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [liveKit]);

  const drawWaveform = useCallback(() => {
    if (
      !analyserRef.current ||
      !waveRenderRef.current ||
      !waveCanvasRef.current
    )
      return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    waveRenderRef.current.clearRect(
      0,
      0,
      waveCanvasRef.current.width / (window.devicePixelRatio || 1),
      waveCanvasRef.current.height / (window.devicePixelRatio || 1)
    );
    waveRenderRef.current.lineWidth = 1;
    waveRenderRef.current.strokeStyle = getWaveStroke();
    waveRenderRef.current.beginPath();

    const sliceWidth =
      waveCanvasRef.current.width /
      (window.devicePixelRatio || 1) /
      bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y =
        (v * (waveCanvasRef.current.height / (window.devicePixelRatio || 1))) /
        2;

      if (i === 0) {
        waveRenderRef.current.moveTo(x, y);
      } else {
        waveRenderRef.current.lineTo(x, y);
      }

      x += sliceWidth;
    }

    waveRenderRef.current.lineTo(
      waveCanvasRef.current.width / (window.devicePixelRatio || 1),
      waveCanvasRef.current.height / (window.devicePixelRatio || 1) / 2
    );
    waveRenderRef.current.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const getWaveStroke = useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    const v = styles.getPropertyValue('--wave-stroke').trim();
    return v || 'var(--primary)';
  }, []);

  const sendVoice = useCallback(
    async (blob: Blob) => {
      const arrayBuffer = await blob.arrayBuffer();
      liveKit.sendMessage(arrayBuffer);
    },
    [liveKit]
  );

  const handleRecording = useCallback(async () => {
    if (recording) {
      await stop();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      if (waveCanvasRef.current) {
        waveCanvasRef.current = undefined;
      }

      if (waveRenderRef.current) {
        waveRenderRef.current = undefined;
      }

      setRecording(false);
    } else {
      setRecording(true);

      await start(async (blob) => {
        await sendVoice(blob);
      });

      waveCanvasRef.current = document.getElementById('voice-wave');
      if (waveCanvasRef.current) {
        waveRenderRef.current = waveCanvasRef.current.getContext('2d');

        waveCanvasRef.current.width = 40 * (window.devicePixelRatio || 1);
        waveCanvasRef.current.height = 18 * (window.devicePixelRatio || 1);

        waveRenderRef.current!.scale(
          window.devicePixelRatio || 1,
          window.devicePixelRatio || 1
        );
      }

      drawWaveform();
    }
  }, [recording, sendVoice, start, stop]);

  const handleKeyboard = useCallback(
    async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
        event.preventDefault();
        await handleRecording();
      }
    },
    [liveKit]
  );

  return (
    <div className='flex flex-row gap-1'>
      {recording ? (
        <div className='flex flex-row gap-1'>
          <Button
            size='icon'
            onClick={() => {
              handleRecording();
            }}
          >
            <MicOff />
          </Button>
          <div className='flex items-center justify-center border-[1px] border-[var(--primary)] rounded-md px-2'>
            <canvas className='w-[80px] h-[36px]' id='voice-wave'></canvas>
          </div>
        </div>
      ) : (
        <Button
          size='icon'
          onClick={() => {
            handleRecording();
          }}
        >
          <Mic />
        </Button>
      )}
    </div>
  );
}
