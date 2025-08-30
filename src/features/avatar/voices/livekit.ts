import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type LiveKitProps = {
  onReceive: () => void;
};

const useLiveKit = ({ onReceive }: LiveKitProps) => {
  const socketRef = useRef<WebSocket | null>(null);

  const onMessage = useCallback(
    (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
    },
    [onReceive]
  );

  useEffect(() => {
    try {
      socketRef.current = new WebSocket('ws://api/voice/asr/live');

      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };

      socketRef.current.onmessage = onMessage;
    } catch (error) {
      toast.error(`Failed to establish livekit websocket ${error}`);
    }

    return () => {
      socketRef.current?.close();
    };
  }, []);
};
