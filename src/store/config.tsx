import {
  EmbeddingConfig,
  LLMConfig,
  TTSConfig,
  VioletConfig,
  WhisperConfig,
} from '@/services/config';
import { create } from 'zustand';

type State = {
  system?: VioletConfig;
  llm?: LLMConfig;
  embedding?: EmbeddingConfig;
  tts?: TTSConfig;
  whisper?: WhisperConfig;
};

type Action = {
  setSystemConfig: (config: VioletConfig) => void;
  setLLMConfig: (config: LLMConfig) => void;
  setEmbeddingConfig: (config: EmbeddingConfig) => void;
  setTTSConfig: (config: TTSConfig) => void;
  setWhisperConfig: (config: WhisperConfig) => void;
};

const useConfigStore = create<State & Action>((set) => ({
  system: undefined,
  llm: undefined,
  embedding: undefined,
  tts: undefined,
  whisper: undefined,
  setSystemConfig: (config) => set({ system: config }),
  setLLMConfig: (config) => set({ llm: config }),
  setEmbeddingConfig: (config) => set({ embedding: config }),
  setTTSConfig: (config) => set({ tts: config }),
  setWhisperConfig: (config) => set({ whisper: config }),
}));

export default useConfigStore;
