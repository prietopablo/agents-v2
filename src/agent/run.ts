import "dotenv/config";
import { mistral } from "@ai-sdk/mistral";
import {
  aiSdkTelemetry,
  getTracer,
  Laminar,
  LaminarAiSdkTelemetry,
} from "@lmnr-ai/lmnr";
import {
  generateText,
  registerTelemetry,
  streamText,
  type ModelMessage,
  type SystemModelMessage,
  type UserModelMessage,
} from "ai";
import type { AgentCallbacks, ToolCallInfo } from "../types.ts";
import { executeTools } from "./executeTools.ts";
import { SYSTEM_PROMPT } from "./system/prompt.ts";
import { tools } from "./tools/index.ts";
import { filterCompatibleMessages } from "./system/filterMessages.ts";

const MODEL_NAME = "mistral-small-latest";
const MODEL = mistral(MODEL_NAME);

registerTelemetry(
  new LaminarAiSdkTelemetry({
    laminarOptions: { projectApiKey: process.env.LMNR_PROJECT_API_KEY },
  }),
);

export const runAgent = async (
  userMessage: string,
  conversationHistory: ModelMessage[] = [],
  agentCallbacks: AgentCallbacks,
): Promise<ModelMessage[]> => {
  const workingHistory = filterCompatibleMessages(conversationHistory);

  const instructions: SystemModelMessage = {
    role: "system",
    content: SYSTEM_PROMPT,
  };

  const userModelMessage: UserModelMessage = {
    role: "user",
    content: userMessage,
  };

  const messages: ModelMessage[] = [
    instructions,
    ...workingHistory,
    userModelMessage,
  ];

  let fullResponse = "";

  while (true) {
    const result = streamText({
      model: MODEL,
      messages,
      tools,
    });

    const toolCalls: ToolCallInfo[] = [];
    let currentText = "";
    let streamError: Error | null = null;

    try {
      for await (const chunk of result.stream) {
        if (chunk.type === "text-delta") {
          currentText += chunk.text;
          agentCallbacks.onToken(chunk.text);
        }

        if (chunk.type === "tool-call") {
          const input = "input" in chunk ? chunk.input : {};
          toolCalls.push({
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: input as any,
          });
          agentCallbacks.onToolCallStart(chunk.toolName, input);
        }
      }
    } catch (e) {
      streamError = e as Error;

      if (
        !currentText &&
        !streamError.message.includes("No output generated")
      ) {
        throw streamError;
      }
    }

    fullResponse += currentText;

    if (streamError && !currentText) {
      fullResponse = "Sorry about that.";
      agentCallbacks.onToken(fullResponse);
      break;
    }

    const finishReason = await result.finishReason;

    if (finishReason !== "tool-calls" || toolCalls.length === 0) {
      const responseMessages = (await result.finalStep).response;
      messages.push(...responseMessages.messages);
      break;
    }

    const responseMessages = (await result.finalStep).response;
    messages.push(...responseMessages.messages);
  }
};
