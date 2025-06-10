import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

type MessageRole = 'user' | 'assistant';

interface PromptMessage {
	role: MessageRole;
	text: string;
}

/**
 * Extracts mustache variables ({{ variable_name }}) from a string
 * @param text - The text to extract variables from
 * @returns An array of unique variable names
 */
export function extractMustacheVariables(text: string): string[] {
	const regex = /\{\{([^{}]*)\}\}/g;
	const variables = new Set<string>();
	let match;

	while ((match = regex.exec(text)) !== null) {
		if (match[1]) {
			variables.add(match[1].trim());
		}
	}

	return [...variables];
}

/**
 * Process a prompt message by replacing mustache variables with values
 * @param message - The message object with role and text
 * @param args - The arguments map with values for variables
 * @returns The processed message with variables replaced
 */
export function processPromptMessage(
	message: PromptMessage,
	args: Record<string, any>,
): { role: MessageRole; content: { type: 'text'; text: string } } {
	let processedText = message.text;

	// Replace all mustache variables
	for (const [key, value] of Object.entries(args)) {
		const escapedKey = key.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
		const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
		processedText = processedText.replace(regex, String(value));
	}

	return {
		role: message.role,
		content: {
			type: 'text',
			text: processedText,
		},
	};
}

/**
 * Process a system prompt by replacing mustache variables with values
 * @param systemPrompt - The system prompt text
 * @param args - The arguments map with values for variables
 * @returns The processed system prompt with variables replaced
 */
export function processSystemPrompt(
	systemPrompt: string,
	args: Record<string, any>,
): string {
	let processedText = systemPrompt;

	// Replace all mustache variables
	for (const [key, value] of Object.entries(args)) {
		const escapedKey = key.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
		const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
		processedText = processedText.replace(regex, String(value));
	}

	return processedText;
}

/**
 * Creates a GetPromptResult by processing system prompt and all messages
 * @param messages - Array of message objects with role and text
 * @param args - Arguments to apply to the prompt templates
 * @param systemPrompt - Optional system prompt text
 * @returns A formatted GetPromptResult for the MCP server
 */
export function createPromptResult(
	messages: PromptMessage[] | null | undefined,
	args: Record<string, any>,
	systemPrompt?: string,
): GetPromptResult {
	const processedMessages = [];

	// Add system prompt as the first assistant message if it exists
	if (systemPrompt) {
		processedMessages.push({
			role: 'assistant',
			content: {
				type: 'text',
				text: processSystemPrompt(systemPrompt, args),
			},
		});
	}

	// Add and process regular messages if they exist
	if (Array.isArray(messages) && messages.length > 0) {
		processedMessages.push(...messages.map((message) => processPromptMessage(message, args)));
	}

	return {
		messages: processedMessages as GetPromptResult['messages'],
	};
}
