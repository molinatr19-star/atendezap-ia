import { createClaudeEngine } from "./claudeEngine";
import { getAiConfig } from "./config";
import { createMockEngine } from "./mockEngine";
import type { AgentEngine } from "./types";

export { getAiConfig } from "./config";
export type { AgentRunResult, AgentToolCall, ChatTurn } from "./types";

/** Motor real quando há ANTHROPIC_API_KEY; simulado caso contrário. */
export function getAgentEngine(): AgentEngine {
  const config = getAiConfig();
  return config.engine === "claude" ? createClaudeEngine(config) : createMockEngine();
}
