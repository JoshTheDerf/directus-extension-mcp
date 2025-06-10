import { createComment, readComments, updateComment } from '@directus/sdk';

import * as z from 'zod';
import { itemQuerySchema } from '../types/query.js';
import { defineTool } from '../utils/define.js';
import { formatErrorResponse, formatSuccessResponse } from '../utils/response.js';

export const readCommentsTool = defineTool('read-comments', {
	description: 'Fetch comments from any Directus collection item.',
	annotations: {
		title: 'Read Comments',
		readOnlyHint: true,
	},
	inputSchema: z.object({
		query: itemQuerySchema.describe(
			'Directus query parameters (filter, sort, fields, limit, etc.)',
		),
	}),
	handler: async (directus, query) => {
		try {
			const { query: queryParams } = query;
			const result = await directus.request(
				readComments(queryParams),
			);
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const upsertCommentTool = defineTool('upsert-comment', {
	description: `Create or update a comment on a collection item. When mentioning users:
	1. First use the read-users tool to retrieve the user's ID
	2. Then format the mention using the exact syntax: @[user-uuid]
	3. Include this formatted mention within your comment text
	Example: "Hey @8cc67ebc-3c52-475a-9ae6-fba26963a9ad, can you take a look at this?"
	IMPORTANT: User mentions MUST use the exact pattern @uuid without any additional characters or formatting. Keep all comments brief and to the point - no more than 2-3 sentences when possible. Focus on essential information only.`,
	annotations: {
		title: 'Create or Update Comment',
		readOnlyHint: true,
	},
	inputSchema: z.object({
		id: z.string().optional().describe('The id of the comment to update. If not provided, a new comment will be created.'),
		collection: z.string().describe('The name of the collection the item belongs to'),
		item: z.union([z.string(), z.number()]).describe('The primary key of the item to comment on.'),
		comment: z.string().describe('The comment text.'),
	}),
	handler: async (directus, input) => {
		try {
			const { collection, item, comment, id } = input;

			const result = await (id
				? directus.request(
						updateComment(id, {
							collection,
							item,
							comment,
						}),
					)
				: directus.request(
						createComment({
							collection,
							item,
							comment,
						}),
					));

			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});
