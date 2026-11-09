import { tools } from "./tools/index.ts";
export type ToolName = keyof typeof tools;

export const executeTools = async (name: string, args: any) => {
  const tool = tools[name as ToolName];

  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }

  const execute = tool.execute;

  if (!execute) {
    throw new Error(`Tool ${name} does not have an execute function`);
  }

  const result = await execute(args, {
    toolCallId: "",
    messages: [],
    context: {},
  });

  return String(result);
};
