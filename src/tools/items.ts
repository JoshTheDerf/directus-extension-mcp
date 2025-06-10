import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk';

import * as z from 'zod';
import { itemQuerySchema } from '../types/query.js';
import { checkCollection } from '../utils/check-collection.js';
import { defineTool } from '../utils/define.js';
import { getPrimaryKeyField } from '../utils/get-primary-key.js';
import { generateCmsLink } from '../utils/links.js';
import {
	formatErrorResponse,
	formatSuccessResponse,
} from '../utils/response.js';

export const readItemsTool = defineTool('read-items', {
	description: `Fetch items from any Directus collection.
		- Use the *fields* param with dot notation to fetch related fields.
		For example – fields: ['title','slug','author.first_name','author.last_name']
		`,
	annotations: {
		title: 'Read Items',
		readOnlyHint: true,
	},
	inputSchema: z.object({
		collection: z.string().describe('The name of the collection to read from'),
		query: itemQuerySchema.describe(
			'Directus query parameters (filter, sort, fields, limit, deep, etc. You can use the read-collections tool to get the schema of the collection first.)',
		),
	}),
	handler: async (directus, query, { schema: contextSchema }) => {
		try {
			const { collection, query: queryParams } = query;
			checkCollection(collection, contextSchema);

			const result = await directus.request(
				readItems(collection as unknown as never, queryParams),
			);
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const createItemTool = defineTool('create-item', {
	description:
		'Create an item in a collection. Will return a link to the created item. You should show the link to the user.',
	annotations: {
		title: 'Create Item',
	},

	inputSchema: z.object({
		collection: z.string().describe('The name of the collection to create in'),
		item: z.record(z.string(), z.unknown()).describe('The item data to create'),
		query: itemQuerySchema
			.pick({ fields: true, meta: true })
			.optional()
			.describe(
				'Optional query parameters for the created item (e.g., fields)',
			),
	}),
	handler: async (directus, input, { schema: contextSchema, baseUrl }) => {
		try {
			const { collection, item, query } = input;
			checkCollection(collection, contextSchema);

			const primaryKeyField = getPrimaryKeyField(collection, contextSchema);

			const result = await directus.request(
				createItem(collection, item, query),
			);

			const id = result[primaryKeyField as any];

			return formatSuccessResponse(
				result,
				`Item created: ${generateCmsLink({ baseUrl: baseUrl as string, type: 'item', collection, id: id ?? '' })}`,
			);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const updateItemTool = defineTool('update-item', {
	description:
		'Update an existing item in a collection. Will return a link to the created item. You should show the link to the user.',
	annotations: {
		title: 'Update Item',
		destructiveHint: true,
	},

	inputSchema: z.object({
		collection: z.string().describe('The name of the collection to update in'),
		id: z
			.union([z.string(), z.number()])
			.describe('The primary key of the item to update'),
		data: z
			.record(z.string(), z.unknown())
			.describe('The partial item data to update'),
		query: itemQuerySchema
			.pick({ fields: true, meta: true })
			.optional()
			.describe(
				'Optional query parameters for the updated item (e.g., fields)',
			),
	}),
	handler: async (directus, input, { schema: contextSchema, baseUrl }) => {
		try {
			const { collection, id, data, query } = input;
			checkCollection(collection, contextSchema);
			const primaryKeyField = getPrimaryKeyField(collection, contextSchema);
			const result = await directus.request(
				updateItem(collection, id, data, query),
			);
			return formatSuccessResponse(
				result,
				`Item updated: ${generateCmsLink({ baseUrl: baseUrl ?? '', type: 'item', collection, id: result[primaryKeyField as any] ?? '' })}`,
			);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const deleteItemTool = defineTool('delete-item', {
	description:
		'Delete a single item from a collection. Please confirm with the user before deleting.',
	annotations: {
		title: 'Delete Item',
		destructiveHint: true,
	},
	inputSchema: z.object({
		collection: z
			.string()
			.describe('The name of the collection to delete from'),
		id: z
			.union([z.string(), z.number()])
			.describe('The primary key of the item to delete'),
	}),
	handler: async (directus, input, { schema: contextSchema }) => {
		try {
			const { collection, id } = input;
			checkCollection(collection, contextSchema);
			const result = await directus.request(deleteItem(collection, id));
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});
