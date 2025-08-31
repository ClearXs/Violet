import { toast } from 'sonner';

type OnReceiveBytes = (audioArray: ArrayBuffer) => void;

type WsAudioDescriptor = {
  type: 'header' | 'chunk';
  sample_rate: number;
  chunk_size?: number;
  media_type: 'raw' | 'string';
};

class LiveKit {
  private socket: WebSocket | null = null;
  private audioData: ArrayBuffer = new ArrayBuffer(0);
  private isHeaderChunk = false;
  private onReceive: OnReceiveBytes;

  constructor(onReceive: OnReceiveBytes) {
    this.onReceive = onReceive;
  }

  public setup() {
    try {
      this.socket = new WebSocket('ws://localhost:10890/live/ws');
      this.socket.onclose = () => {
        toast.error('Livekit connection closed');
      };

      this.socket.onmessage = this.onMessage;
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
    if (this.socket) {
      this.socket.send(msg);
    }
  }

  public close() {
    this.socket?.close();
  }
}

export default LiveKit;
