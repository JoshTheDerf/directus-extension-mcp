import { readMe, readUsers } from '@directus/sdk';
import * as z from 'zod';
import { itemQuerySchema } from '../types/query.js';
import { defineTool } from '../utils/define.js';
import { formatErrorResponse, formatSuccessResponse } from '../utils/response.js';

export const usersMeTool = defineTool('users-me', {
	description: 'Retrieve information about the current user',
	inputSchema: z.object({
		fields: z.array(z.string()),
	}),
	handler: async (directus, { fields }) => {
		const me = await directus.request(readMe({ fields }));

		return { content: [{ type: 'text', text: JSON.stringify(me) }] };
	},
});

export const readUsersTool = defineTool('read-users', {
	description: 'Retrieve information about users.',
	inputSchema: z.object({
		query: itemQuerySchema.describe(
			'Directus query parameters (filter, sort, fields, limit, deep, etc. You can use the read-collections tool to get the schema of the collection first.)',
		),
	}),
	handler: async (directus, { query }) => {
		try {
			const users = await directus.request(readUsers(query));
			return formatSuccessResponse(users);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});
