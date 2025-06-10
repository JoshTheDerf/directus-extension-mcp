import type { Config } from '../config.js';
import { readItems } from '@directus/sdk';
import * as z from 'zod';
import { itemQuerySchema } from '../types/query.js';
import { defineTool } from '../utils/define.js';
import { formatErrorResponse, formatSuccessResponse } from '../utils/response.js';

export function createSystemPrompt(config: Config) {
	return defineTool('system-prompt', {
		description:
			'IMPORTANT! Call this tool first. It will retrieve important information about your role.',
		inputSchema: z.object({}),
		handler: async (_directus, _args) => {
			return {
				content: [{ type: 'text', text: config.MCP_SYSTEM_PROMPT as string }],
			};
		},
	});
}

export function getPromptsTool(config: Config) {
	return defineTool('get-prompts', {
		description: 'Retrieve the list of prompts available to the user.',
		inputSchema: z.object({
			query: itemQuerySchema.describe(
				'Directus query parameters (filter, sort, fields, limit, deep, etc. You can use the read-collections tool to get the schema of the collection first.)',
			),
		}),
		handler: async (directus, query) => {
			try {
				if (config.DIRECTUS_PROMPTS_COLLECTION_ENABLED === 'false') {
					throw new Error('DIRECTUS_PROMPTS_COLLECTION_ENABLED is false');
				}

				if (!config.DIRECTUS_PROMPTS_COLLECTION) {
					throw new Error('DIRECTUS_PROMPTS_COLLECTION is not set');
				}

				const result = await directus.request(readItems(config.DIRECTUS_PROMPTS_COLLECTION as unknown as never, query));
				return formatSuccessResponse(result);
			}
			catch (error) {
				return formatErrorResponse(error);
			}
		},
	});
}
