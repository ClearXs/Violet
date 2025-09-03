import { useCallback, useEffect, useRef, useState } from 'react';
import LiveKit from './voices/livekit';
import useRecorder from './voices/record';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Mic, MicOff, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import useSpeakApi from './voices/speak';
import { useViewer } from './vrm/viewerContext';

type ToolsProps = {
  liveKit: LiveKit;
};

export default function Tools({ liveKit }: ToolsProps) {
  const { start, stop, analyserRef } = useRecorder();
  const [recording, setRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');

  const [textLoading, setTextLoading] = useState(false);

  const waveCanvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const waveRenderRef = useRef<CanvasRenderingContext2D | undefined>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const animationFrameRef = useRef<number | undefined>(undefined);

  const speakApi = useSpeakApi();
  const viewer = useViewer();

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);

      liveKit.addOnClose(() => {
        setRecording(false);
      });

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
    waveRenderRef.current.lineWidth = 0.5;
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
    const v = styles.getPropertyValue('--primary').trim();
    return v || '#fff';
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

  const handleToggleTextInput = useCallback(() => {
    setShowTextInput((prev) => !prev);
    if (showTextInput) {
      setTextMessage('');
    }
  }, [showTextInput]);

  const handleKeyPress = useCallback(
    async (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !textLoading) {
        await sendTextMessage(textMessage);
      }
    },
    [textMessage]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setTextLoading(true);
      await speakApi.speak('neutral', viewer, text, undefined, () => {
        setTextMessage('');
        setTextLoading(false);
      });
    },
    [textMessage]
  );

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

      <Button size='icon' onClick={handleToggleTextInput}>
        <MessageSquare />
      </Button>

      {showTextInput && (
        <div className='flex flex-row gap-1'>
          <Input
            ref={textInputRef}
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder='Type your message...'
            className='flex-1'
          />
          <Button
            size='icon'
            onClick={() => sendTextMessage(textMessage)}
            disabled={!textMessage.trim() || textLoading}
          >
            {textLoading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Send />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
