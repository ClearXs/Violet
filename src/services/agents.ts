/**
 * Agent type enumeration
 */
export enum AgentType {
  CODER_AGENT = "coder_agent",
  CHAT_AGENT = "chat_agent",
  REFLEXION_AGENT = "reflexion_agent",
  BACKGROUND_AGENT = "background_agent",
  EPISODIC_MEMORY_AGENT = "episodic_memory_agent",
  PROCEDURAL_MEMORY_AGENT = "procedural_memory_agent",
  RESOURCE_MEMORY_AGENT = "resource_memory_agent",
  KNOWLEDGE_VAULT_AGENT = "knowledge_vault_agent",
  META_MEMORY_AGENT = "meta_memory_agent",
  SEMANTIC_MEMORY_AGENT = "semantic_memory_agent",
  CORE_MEMORY_AGENT = "core_memory_agent",
}

/**
 * Environment variable for agent tool execution
 */
export interface AgentEnvironmentVariable {
  key: string;
  value: string;
}

/**
 * Tool rule interface
 */
export interface ToolRule {
  // Define based on your tool rule schema
  [key: string]: any;
}

/**
 * Memory interface
 */
export interface Memory {
  // Define based on your memory schema
  [key: string]: any;
}

/**
 * Tool interface
 */
export interface Tool {
  id: string;
  name: string;
  description?: string;
  // Add other tool properties as needed
}

/**
 * Block interface
 */
export interface Block {
  id: string;
  label: string;
  value: string;
  limit: number;
  // Add other block properties as needed
}

/**
 * CreateBlock interface
 */
export interface CreateBlock {
  label: string;
  value: string;
  limit?: number;
}

/**
 * Message interface
 */
export interface Message {
  id: string;
  role: string;
  content: string;
  created_at?: string;
  // Add other message properties as needed
}

/**
 * MessageCreate interface
 */
export interface MessageCreate {
  role: string;
  content: string;
  // Add other message creation properties as needed
}

/**
 * Usage statistics interface
 */
export interface UsageStatistics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  // Add other usage statistics as needed
}

/**
 * Agent state interface
 */
export interface AgentState {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  message_ids?: string[];
  memory: Memory;
  tools: Tool[];
  system: string;
  topic: string;
  agent_type: AgentType;
  llm_config: any; // Use your LLMConfig interface
  embedding_config: any; // Use your EmbeddingConfig interface
  organization_id?: string;
  description?: string;
  metadata_?: Record<string, any>;
  tags: string[];
  tool_rules?: ToolRule[];
  tool_exec_environment_variables: AgentEnvironmentVariable[];
}

/**
 * Create agent interface
 */
export interface CreateAgent {
  name?: string;
  memory_blocks?: CreateBlock[];
  tools?: string[];
  tool_ids?: string[];
  block_ids?: string[];
  tool_rules?: ToolRule[];
  tags?: string[];
  system?: string;
  topic?: string;
  agent_type?: AgentType;
  llm_config?: any; // Use your LLMConfig interface
  embedding_config?: any; // Use your EmbeddingConfig interface
  initial_message_sequence?: MessageCreate[];
  include_base_tools?: boolean;
  include_multi_agent_tools?: boolean;
  description?: string;
  metadata_?: Record<string, any>;
  model?: string;
  embedding?: string;
  context_window_limit?: number;
  embedding_chunk_size?: number;
  from_template?: string;
  template?: boolean;
  project?: string;
  tool_exec_environment_variables?: Record<string, string>;
  memory_variables?: Record<string, string>;
}

/**
 * Update agent interface
 */
export interface UpdateAgent {
  name?: string;
  tool_ids?: string[];
  block_ids?: string[];
  tags?: string[];
  system?: string;
  topic?: string;
  tool_rules?: ToolRule[];
  llm_config?: any; // Use your LLMConfig interface
  embedding_config?: any; // Use your EmbeddingConfig interface
  message_ids?: string[];
  description?: string;
  metadata_?: Record<string, any>;
  tool_exec_environment_variables?: Record<string, string>;
}

/**
 * Agent step response interface
 */
export interface AgentStepResponse {
  messages: Message[];
  continue_chaining: boolean;
  function_failed: boolean;
  in_context_memory_warning: boolean;
  usage: UsageStatistics;
  traj?: Record<string, any>;
}

/**
 * Agent step state interface
 */
export interface AgentStepState {
  step_number: number;
  tool_rules_solver: any; // Define based on your ToolRulesSolver
}

/**
 * Agent list query parameters
 */
export interface AgentListParams {
  tags?: string[];
  match_all_tags?: boolean;
  limit?: number;
  query_text?: string;
}

/**
 * Agent API hook for managing agent operations
 */
const useAgentApi = () => {
  /**
   * List all agents with optional filtering
   */
  const listAgents = (params?: AgentListParams): Promise<R<AgentState[]>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.tags) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }
    if (params?.match_all_tags !== undefined) {
      searchParams.append('match_all_tags', params.match_all_tags.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.query_text) {
      searchParams.append('query_text', params.query_text);
    }

    const queryString = searchParams.toString();
    const url = `/api/agents${queryString ? `?${queryString}` : ''}`;

    return fetch(url, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  return {
    listAgents,
  };
};

export default useAgentApi;