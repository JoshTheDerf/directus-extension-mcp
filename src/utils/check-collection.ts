import type { Schema } from '../types/schema.js';
import { formatErrorResponse } from './response.js';

/**
 * Check if a collection exists in the context schema.
 * @param collection - The collection to check.
 * @param contextSchema - The context schema.
 * @returns The collection if it exists, otherwise an error.
 */
export function checkCollection(collection: string, contextSchema: Schema) {
	if (collection && !contextSchema[collection]) {
		return formatErrorResponse(
			new Error(
				`Collection "${collection}" not found. Use read-collections tool first.`,
			),
		);
	}

	return contextSchema[collection];
}
