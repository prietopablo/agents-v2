import { type ModelMessage, type ToolSet, tool } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../src/agent/system/prompt.ts";
import type { EvalData, MultiTurnEvalData } from "./types.ts";

/**
 * Build mocked tools from data config.
 * Each tool returns its configured mockReturn value.
 */
export const buildMockedTools = (
  mockTools: MultiTurnEvalData["mockTools"],
): ToolSet => {
  const tools: ToolSet = {};

  for (const [name, config] of Object.entries(mockTools)) {
    // Build parameter schema dynamically
    const paramSchema: Record<string, z.ZodString> = {};
    for (const paramName of Object.keys(config.parameters)) {
      paramSchema[paramName] = z.string();
    }

    tools[name] = tool({
      description: config.description,
      inputSchema: z.object(paramSchema),
      execute: async () => config.mockReturn,
    });
  }

  return tools;
};

/**
 * Build message array from eval data
 * Returns only user message for generateText, system prompt should be passed via instructions
 */
export const buildMessages = (
  data: EvalData | { prompt?: string; systemPrompt?: string },
): ModelMessage[] => {
  // Remove system message from array - it will be passed via instructions parameter
  return [{ role: "user", content: data.prompt! }];
};

/**
 * Get system prompt from eval data
 */
export const getSystemPrompt = (
  data: EvalData | { prompt?: string; systemPrompt?: string },
): string => {
  return data.systemPrompt ?? SYSTEM_PROMPT;
};
