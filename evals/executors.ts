import { mistral } from "@ai-sdk/mistral";
import { generateText, stepCountIs, type ToolSet, tool } from "ai";
import { z } from "zod";
import type {
  EvalData,
  MultiTurnEvalData,
  MultiTurnResult,
  SingleTurnResult,
} from "./types.ts";
import { buildMessages } from "./utils.ts";

const TOOL_DEFINITIONS = {
  readFile: {
    description: "Read the contents of a file at a specified path",
    inputSchema: z.object({
      path: z.string().describe("The path to the file to read"),
    }),
  },
  writeFile: {
    description: "Write the given content to a file at the given path",
    inputSchema: z.object({
      path: z.string().describe("The path to the file to write to"),
      content: z.string().describe("The content to write to the file"),
    }),
  },
  listFiles: {
    description: "List all the files in a directory",
    inputSchema: z.object({
      path: z
        .string()
        .describe("The path to the directory to list the files of"),
    }),
  },
  deleteFile: {
    description: "Delete a file at the given path",
    inputSchema: z.object({
      path: z.string().describe("The path to the file to delete"),
    }),
  },
  runCommand: {
    description: "Run a shell command and return the output",
    inputSchema: z.object({
      command: z.string().describe("The shell command to run"),
    }),
  },
};

export const singleTurnExecutor = async (data: EvalData) => {
  const messages = buildMessages(data);

  const tools: ToolSet = {};
  for (const toolName of data.tools) {
    const def = TOOL_DEFINITIONS[toolName];
    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.inputSchema,
      });
    }
  }

  const { toolCalls } = await generateText({
    model: mistral(data.config?.model ?? "mistral-small-latest"),
    messages,
    tools,
  });
};
