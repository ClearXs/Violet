export interface LLMConfig {
  /** The name of the LLM model */
  model: string;

  /** The endpoint type for the model */
  model_endpoint_type?: 'openai' | 'ollama' | 'llama' | 'mlx-vlm';

  /** The endpoint for the model */
  model_endpoint?: string;

  /** Multi-modal projection model path. as llm vision module */
  mmproj_model?: string;

  /** The wrapper for the model */
  model_wrapper?: string;

  /** The context window size for the model */
  context_window: number;

  /**
   * Puts 'inner_thoughts' as a kwarg in the function call if this is set to True.
   * This helps with function calling performance and also the generation of inner thoughts.
   */
  put_inner_thoughts_in_kwargs?: boolean;

  /** The handle for this config, in the format provider/model-name */
  handle?: string;

  /**
   * The temperature to use when generating text with the model.
   * A higher temperature will result in more random text.
   */
  temperature?: number;

  /**
   * The maximum number of tokens to generate.
   * If not set, the model will use its default value.
   */
  max_tokens?: number;

  /** Whether or not the model should use extended thinking if it is a 'reasoning' style model */
  enable_reasoner?: boolean;

  /** The reasoning effort to use when generating text reasoning models */
  reasoning_effort?: 'low' | 'medium' | 'high';

  /**
   * Configurable thinking budget for extended thinking, only used if enable_reasoner is True.
   * Minimum value is 1024.
   */
  max_reasoning_tokens?: number;

  /** Custom API key for this specific model configuration (used for custom models) */
  api_key?: string;

  /** The API version for Azure OpenAI (e.g., '2024-10-01-preview') */
  api_version?: string;

  /** The Azure endpoint for the model (e.g., 'https://your-resource.openai.azure.com/') */
  azure_endpoint?: string;

  /** The Azure deployment name for the model */
  azure_deployment?: string;
}

export interface EmbeddingConfig {
  /** The endpoint type for the model */
  embedding_endpoint_type:
    | 'openai'
    | 'anthropic'
    | 'bedrock'
    | 'cohere'
    | 'google_ai'
    | 'azure'
    | 'groq'
    | 'ollama'
    | 'webui'
    | 'webui-legacy'
    | 'lmstudio'
    | 'lmstudio-legacy'
    | 'llamacpp'
    | 'koboldcpp'
    | 'vllm'
    | 'hugging-face'
    | 'mistral'
    | 'together'
    | 'llama';

  /** The endpoint for the model (`undefined` if local) */
  embedding_endpoint?: string;

  /** The model for the embedding */
  embedding_model: string;

  /** The dimension of the embedding */
  embedding_dim: number;

  /** The chunk size of the embedding */
  embedding_chunk_size?: number;

  /** The handle for this config, in the format provider/model-name */
  handle?: string;

  /** The Azure endpoint for the model (Azure only) */
  azure_endpoint?: string;

  /** The Azure version for the model (Azure only) */
  azure_version?: string;

  /** The Azure deployment for the model (Azure only) */
  azure_deployment?: string;
}

/**
 * TTS configuration for a specific version or custom setup
 */
export interface TTSVersionConfig {
  /** Base path for BERT model */
  bert_base_path: string;

  /** Base path for Chinese HuBERT model */
  cnhuhbert_base_path: string;

  /** Device to run on (cpu/cuda/etc.) */
  device: string;

  /** Whether to use half precision */
  is_half: boolean;

  /** Path to T2S (Text-to-Speech) weights */
  t2s_weights_path: string;

  /** Version identifier */
  version: string;

  /** Path to VITS weights */
  vits_weights_path: string;
}

/**
 * Complete TTS inference configuration
 */
export interface TTSConfig {
  /** Custom TTS configuration */
  custom: TTSVersionConfig;

  /** Version 1 configuration */
  v1: TTSVersionConfig;

  /** Version 2 configuration */
  v2: TTSVersionConfig;

  /** Version 3 configuration */
  v3: TTSVersionConfig;

  /** Version 4 configuration */
  v4: TTSVersionConfig;
}

/**
 * Supported TTS versions
 */
export type TTSVersion = 'custom' | 'v1' | 'v2' | 'v3' | 'v4';

/**
 * Device options for TTS inference
 */
export type TTSDevice = 'cpu' | 'cuda' | 'mps' | string;

/**
 * Whisper configuration interface
 */
export interface WhisperConfig {
  /** Model path or identifier */
  model: string;

  /** Engine type - currently only whisper is supported */
  engine: 'whisper';

  /** API server endpoint (optional for local models) */
  endpoint?: string;

  /** API key for external services (optional) */
  api_key?: string;
}

const useConfigApi = () => {
  const getLLMConfig = (): Promise<LLMConfig> => {
    return fetch('/api/config/llm', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  const updateLLMConfig = (llm_config: LLMConfig): Promise<boolean> => {
    return fetch('/api/config/llm', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(llm_config),
    }).then((res) => {
      return res.json();
    });
  };

  const getEmbeddingConfig = (): Promise<EmbeddingConfig> => {
    return fetch('/api/config/embedding', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  const updateEmbeddingConfig = (
    embedding_config: EmbeddingConfig
  ): Promise<boolean> => {
    return fetch('/api/config/embedding', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(embedding_config),
    }).then((res) => {
      return res.json();
    });
  };

  const getTTSConfig = (): Promise<TTSConfig> => {
    return fetch('/api/config/tts', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  const updateTTSConfig = (tts_config: TTSConfig): Promise<boolean> => {
    return fetch('/api/config/tts', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(tts_config),
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Get Whisper configuration
   */
  const getWhisperConfig = (): Promise<WhisperConfig> => {
    return fetch('/api/config/whisper', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Update Whisper configuration
   */
  const updateWhisperConfig = (config: WhisperConfig): Promise<boolean> => {
    return fetch('/api/config/whisper', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config),
    }).then((res) => {
      return res.ok;
    });
  };

  return {
    getLLMConfig,
    updateLLMConfig,
    getEmbeddingConfig,
    updateEmbeddingConfig,
    getTTSConfig,
    updateTTSConfig,
    getWhisperConfig,
    updateWhisperConfig,
  };
};

export default useConfigApi;
