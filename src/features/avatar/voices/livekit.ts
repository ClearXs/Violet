import { toast } from 'sonner';

type OnReceiveBytes = (audioArray: ArrayBuffer) => void;

type WsAudioDescriptor = {
  type: 'header' | 'chunk';
  sample_rate: number;
  chunk_size?: number;
  media_type: 'raw' | 'string';
};

type OnLiveClose = () => void;
type OnLiveError = (error: Event) => void;

class LiveKit {
  private socket: WebSocket | null = null;
  private audioData: ArrayBuffer = new ArrayBuffer(0);
  private isHeaderChunk = false;
  private onReceive: OnReceiveBytes;

  private liveCloseListeners: OnLiveClose[] = [];
  private liveErrorListener: OnLiveError[] = [];

  constructor(onReceive: OnReceiveBytes) {
    this.onReceive = onReceive;

    this.setup();
  }

  set setOnReceive(callback: OnReceiveBytes) {
    this.onReceive = callback;
  }

  public setup() {
    try {
      this.socket = new WebSocket('ws://localhost:10890/live/ws');
      this.socket.onclose = this.close.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onerror = (error) => {
        this.liveErrorListener.forEach((listener) => listener(error));
      };
    } catch (error) {
      toast.error(`Failed to establish livekit websocket ${error}`);
    }
  }

  private async onMessage(ev: MessageEvent) {
    const data = JSON.parse(ev.data);

    if (data instanceof Blob) {
      const ab = await data.arrayBuffer();

      // when ws send header chunk wait for next specific audio data
      if (this.isHeaderChunk) {
        this.audioData = ab;
      } else {
        const completeAudioData = new Uint8Array(
          this.audioData.byteLength + ab.byteLength
        );

        completeAudioData.set(new Uint8Array(this.audioData), 0);
        completeAudioData.set(new Uint8Array(ab), this.audioData.byteLength);

        this.onReceive(completeAudioData.buffer);

        // reset array buffer
        this.audioData = new ArrayBuffer(0);
      }
    } else {
      const { type } = JSON.parse(ev.data) as WsAudioDescriptor;
      if (type === 'header') {
        this.isHeaderChunk = true;
      } else if (type === 'chunk') {
        this.isHeaderChunk = false;
      }
    }
  }

  public sendMessage(msg: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
    }
  }

  public close() {
    this.liveCloseListeners.forEach((listener) => listener());
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket?.close();
      toast.error('Livekit connection closed');
    }
  }

  public addOnClose(listener: OnLiveClose) {
    this.liveCloseListeners.push(listener);
  }

  public addOnError(listener: OnLiveError) {
    this.liveErrorListener.push(listener);
  }
}

export default LiveKit;
