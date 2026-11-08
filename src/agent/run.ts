import "dotenv/config";
import { generateText, type ModelMessage } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { SYSTEM_PROMPT } from "./system/prompt";
import type { AgentCallbacks } from "../types";
const MODEL_NAME = "mistral-small-latest";
const MODEL = mistral(MODEL_NAME);

export const runAgent = async (
  userMessage: string,
  conversation: ModelMessage[],
  agentCallbacks: AgentCallbacks,
) => {
  const { text } = await generateText({
    model: MODEL,
    prompt: userMessage,
    system: SYSTEM_PROMPT,
  });

  console.log(text);
};

runAgent("Hello, how are you?");
