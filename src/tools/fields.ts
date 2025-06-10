import {
	createField,
	readField,
	readFields,
	readFieldsByCollection,
	updateField,
} from '@directus/sdk';
import * as z from 'zod';
import {
	CreateFieldDataSchema,
	UpdateFieldDataSchema,
} from '../types/fields.js';
import { defineTool } from '../utils/define.js';
import {
	formatErrorResponse,
	formatSuccessResponse,
} from '../utils/response.js';

export const readFieldsTool = defineTool('read-fields', {
	description:
		'Retrieve the field definitions for all collections or a specific collection. Note: This is lots of data and should be used sparingly. Use only if you cannot find the field information you need and you absolutely need to have the raw field definition.',
	inputSchema: z.object({
		collection: z
			.string()
			.optional()
			.describe(
				'Optional: The name (ID) of the collection to retrieve fields for. If omitted, fields for all collections are returned.',
			),
	}),
	handler: async (directus, { collection }) => {
		try {
			const fields = collection
				? await directus.request(readFieldsByCollection(collection))
				: await directus.request(readFields());
			return formatSuccessResponse(fields);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const readFieldTool = defineTool('read-field', {
	description:
		'Retrieve the definition of a specific field within a collection.',
	inputSchema: z.object({
		collection: z
			.string()
			.describe('The name (ID) of the collection the field belongs to.'),
		field: z.string().describe('The name (ID) of the field to retrieve.'),
	}),
	handler: async (directus, { collection, field }) => {
		try {
			const fieldData = await directus.request(readField(collection, field));
			return formatSuccessResponse(fieldData);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const createFieldTool = defineTool('create-field', {
	description: 'Create a new field in a specified collection.',

	inputSchema: z.object({
		collection: z
			.string()
			.describe('The name (ID) of the collection to add the field to.'),
		data: CreateFieldDataSchema.describe(
			'The data for the new field (field name, type, optional schema/meta).',
		),
	}),
	handler: async (directus, { collection, data }) => {
		try {
			const result = await directus.request(createField(collection, data));
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const updateFieldTool = defineTool('update-field', {
	description: 'Update an existing field in a specified collection.',
	inputSchema: z.object({
		collection: z
			.string()
			.describe('The name (ID) of the collection containing the field.'),
		field: z.string().describe('The name (ID) of the field to update.'),
		data: UpdateFieldDataSchema.describe(
			'The partial data to update the field with (type, schema, meta).',
		),
	}),
	handler: async (directus, { collection, field, data }) => {
		try {
			const result = await directus.request(updateField(collection, field, data));
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});
