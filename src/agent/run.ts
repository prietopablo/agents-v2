import "dotenv/config";
import { mistral } from "@ai-sdk/mistral";
import { aiSdkTelemetry, Laminar } from "@lmnr-ai/lmnr";
import { generateText, type ModelMessage } from "ai";
import type { AgentCallbacks } from "../types";
import { executeTools } from "./executeTools.ts";
import { SYSTEM_PROMPT } from "./system/prompt";
import { tools } from "./tools/index.ts";

const MODEL_NAME = "mistral-small-latest";
const MODEL = mistral(MODEL_NAME);

Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});

export const runAgent = async (
  userMessage: string,
  conversation?: ModelMessage[],
  agentCallbacks?: AgentCallbacks,
) => {
  const { text, toolCalls } = await generateText({
    model: MODEL,
    prompt: userMessage,
    system: SYSTEM_PROMPT,
    tools,
    toolChoice: "auto",
    experimental_telemetry: {
      isEnabled: true,
      integrations: aiSdkTelemetry(),
    },
  });

  console.log(text, toolCalls);

  toolCalls?.forEach(async (toolCall) => {
    const result = await executeTools(toolCall.toolName, toolCall.input);
    console.log(result);
  });
};

runAgent("What is the current date and time?");
