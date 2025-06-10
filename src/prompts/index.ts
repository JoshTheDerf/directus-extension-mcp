import type { Config } from '../config.js';
import type { Directus } from '../directus.js';
import type { Schema } from '../types/schema.js';
import { readItems } from '@directus/sdk';
import { extractMustacheVariables } from '../utils/prompt-helpers.js';

export interface PromptItem {
	id: string;
	name: string;
	description: string;
	systemPrompt: string;
	messages: Array<{
		role: 'user' | 'assistant';
		text: string;
	}>;
}

export interface McpPrompt {
	name: string;
	description: string;
	arguments: Array<{
		name: string;
		description: string;
		required: boolean;
	}>;
}

/**
 * Fetches prompts from the Directus collection specified in the config
 * @param directus - The Directus client
 * @param config - The application config
 * @returns A map of prompt name to MCP prompt definition
 */
export async function fetchPrompts(
	directus: Directus,
	config: Config,
	schema: Schema,
): Promise<Record<string, McpPrompt>> {
	// If no prompts collection is configured, return an empty object
	if (!config.DIRECTUS_PROMPTS_COLLECTION) {
		console.error('No prompts collection configured, skipping prompt fetching');
		return {};
	}

	// If the prompts collection isn't in the schema, then throw an error because there's a permissions issue or it doesn't exist
	if (!schema[config.DIRECTUS_PROMPTS_COLLECTION]) {
		throw new Error(
			'Prompts collection not found in the schema. Use the read-collections tool first. If you have already used the read-collections tool, then check the permissions of the user you are using to fetch prompts.',
		);
	}

	console.error('config', config);

	// Check the prompts collection has the required fields
	const requiredFields = [
		config.DIRECTUS_PROMPTS_NAME_FIELD,
		config.DIRECTUS_PROMPTS_DESCRIPTION_FIELD,
		config.DIRECTUS_PROMPTS_SYSTEM_PROMPT_FIELD,
		config.DIRECTUS_PROMPTS_MESSAGES_FIELD,
	];

	for (const field of requiredFields) {
		if (!schema[config.DIRECTUS_PROMPTS_COLLECTION]?.[field as keyof typeof schema[string]]) {
			throw new Error(`Prompt field ${field} not found in the prompts collection.`);
		}
	}

	try {
		type DirectusCollection = any;

		const response = (await directus.request(
			// @ts-expect-error - We're using a dynamic collection name
			readItems(config.DIRECTUS_PROMPTS_COLLECTION),
		)) as DirectusCollection[];

		const prompts: Record<string, McpPrompt> = {};

		for (const item of response) {
			// Still include prompts even if messages are empty or null
			const variables = new Set<string>();
			const messagesField = config.DIRECTUS_PROMPTS_MESSAGES_FIELD as string;
			const systemPromptField = config.DIRECTUS_PROMPTS_SYSTEM_PROMPT_FIELD as string;

			// Extract variables from system prompt if it exists
			if (item[systemPromptField]) {
				for (const variable of extractMustacheVariables(item[systemPromptField])) {
					variables.add(variable);
				}
			}

			// Extract variables from messages if they exist
			if (item[messagesField] && Array.isArray(item[messagesField])) {
				for (const message of item[messagesField]) {
					if (message && message.text) {
						for (const variable of extractMustacheVariables(message.text)) {
							variables.add(variable);
						}
					}
				}
			}

			prompts[item.name] = {
				name: item.name,
				description: item.description || `Prompt: ${item.name}`,
				arguments: [...variables].map((name) => ({
					name,
					description: `Value for ${name}`,
					required: false,
				})),
			};
		}

		return prompts;
	}
	catch (error) {
		console.error('Error fetching prompts:', error);
		return {};
	}
}

/**
 * Fetches a specific prompt by name from Directus
 * @param directus - The Directus client
 * @param config - The application config
 * @param promptName - The name of the prompt to fetch
 * @returns The prompt item if found, undefined otherwise
 */
export async function fetchPromptByName(
	directus: Directus,
	config: Config,
	promptName: string,
): Promise<PromptItem | undefined> {
	if (!config.DIRECTUS_PROMPTS_COLLECTION) return undefined;

	try {
		type DirectusCollection = any;

		const response = (await directus.request(
			// @ts-expect-error - We're using a dynamic collection name
			readItems(config.DIRECTUS_PROMPTS_COLLECTION, {
				filter: {
					[config.DIRECTUS_PROMPTS_NAME_FIELD as string]: {
						_eq: promptName,
					},
				},
				limit: 1,
			}),
		)) as DirectusCollection[];

		if (!response || response.length === 0) return undefined;

		// Map Directus item to our expected format
		const item = response[0];
		const nameField = config.DIRECTUS_PROMPTS_NAME_FIELD as string;
		const descriptionField = config.DIRECTUS_PROMPTS_DESCRIPTION_FIELD as string;
		const systemPromptField = config.DIRECTUS_PROMPTS_SYSTEM_PROMPT_FIELD as string;
		const messagesField = config.DIRECTUS_PROMPTS_MESSAGES_FIELD as string;

		return {
			id: item.id,
			name: item[nameField],
			description: item[descriptionField],
			systemPrompt: item[systemPromptField] || '',
			messages: item[messagesField] || [],
		};
	}
	catch (error) {
		console.error(`Error fetching prompt ${promptName}:`, error);
		return undefined;
	}
}
