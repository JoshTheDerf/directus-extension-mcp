import type { Config } from "../config.js";
import type { ToolDefinition } from "../types/tool.js";
import { readCommentsTool, upsertCommentTool } from "./comments.js";
import {
  createFieldTool,
  readFieldsTool,
  readFieldTool,
  updateFieldTool,
} from "./fields.js";
import {
  importFileTool,
  readFilesTool,
  readFoldersTool,
  updateFilesTool,
} from "./files.js";
import { readFlowsTool, triggerFlowTool } from "./flows.js";
import {
  createItemTool,
  deleteItemTool,
  readItemsTool,
  updateItemTool,
} from "./items.js";
import { markdownTool } from "./markdown.js";
import { createSystemPrompt } from "./prompts.js";
import schemaTool from "./schema.js";
import { readUsersTool, usersMeTool } from "./users.js";

export const getTools = (config: Config) => {
  const toolList: ToolDefinition[] = [
    // Users
    usersMeTool,
    readUsersTool,
    // Schema
    schemaTool,
    // Items
    readItemsTool,
    createItemTool,
    updateItemTool,
    deleteItemTool,
    // Flows
    readFlowsTool,
    triggerFlowTool,
    // Files
    readFoldersTool,
    readFilesTool,
    importFileTool,
    updateFilesTool,
    // Fields
    readFieldsTool,
    readFieldTool,
    createFieldTool,
    updateFieldTool,
    // Comments
    readCommentsTool,
    upsertCommentTool,
    // Markdown
    markdownTool,
  ];

  // If system propmt is enabled and exists, add the system prompt tool
  if (config.MCP_SYSTEM_PROMPT_ENABLED === "true" && config.MCP_SYSTEM_PROMPT) {
    toolList.push(createSystemPrompt(config));
  }

  // Filter the list of available tools based on cof
  const availableTools = toolList.filter(
    (tool) => !config.DISABLE_TOOLS.includes(tool.name)
  );

  return availableTools;
};
