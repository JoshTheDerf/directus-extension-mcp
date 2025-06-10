import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import type { Config } from '../config.js';
import type { Directus } from '../directus.js';
import type { McpPrompt } from './index.js';
import { createPromptResult } from '../utils/prompt-helpers.js';
import { fetchPromptByName } from './index.js';

/**
 * Handler for get-prompt requests. Fetches the prompt from Directus and processes it.
 * @param directus - The Directus client
 * @param config - The application configuration
 * @param promptName - The name of the prompt to fetch
 * @param args - The arguments to apply to the prompt template
 * @returns The processed prompt result
 */
export async function handleGetPrompt(
	directus: Directus,
	config: Config,
	promptName: string,
	args: Record<string, any> = {},
): Promise<GetPromptResult> {
	const promptItem = await fetchPromptByName(directus, config, promptName);

	if (!promptItem) {
		throw new Error(`Prompt not found: ${promptName}`);
	}

	// Ensure messages is an array, even if empty
	const messages = promptItem.messages || [];
	return createPromptResult(messages, args, promptItem.systemPrompt);
}

/**
 * Returns all available prompts from Directus
 * @param prompts - Record of prompt name to prompt definition
 * @returns An array of MCP prompt definitions
 */
export function getAvailablePrompts(prompts: Record<string, McpPrompt>): McpPrompt[] {
	return Object.values(prompts);
}
