import { readFlows, triggerFlow } from '@directus/sdk';

import * as z from 'zod';
import { defineTool } from '../utils/define.js';
import {
	formatErrorResponse,
	formatSuccessResponse,
} from '../utils/response.js';

export const readFlowsTool = defineTool('read-flows', {
	description: 'Fetch manually triggerable flows from Directus. Flows allow users to automate tasks inside Directus.',
	annotations: {
		title: 'Read Flows',
		readOnlyHint: true,
	},
	inputSchema: z.object({}),
	handler: async (directus, _query) => {
		try {
			const result = await directus.request(
				readFlows({
					filter: {
						trigger: {
							// @ts-expect-error - _prefixed operators not working
							_eq: 'manual',
						},
					},
				}),
			);

			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});

export const triggerFlowTool = defineTool('trigger-flow', {
	description: `Trigger a flow by ID. Rules:
	  - Always call read-flows first and include the FULL flow definition in your reasoning
	  - Always explicitly check if the flow requires selection (options.requireSelection !== false)
	  - Always verify the collection is in the flow's collections list
	  - Always provide a complete data object with all required fields
	  - NEVER skip providing keys when requireSelection is true or undefined`,
	annotations: {
		title: 'Trigger Flow',
	},

	inputSchema: z.object({
		flowDefinition: z
			.record(z.string(), z.any())
			.describe('The full flow definition from the read-flows call.'),
		flowId: z.string().describe('The ID of the flow to trigger'),
		collection: z
			.string()
			.describe('The collection of the items to trigger the flow on.'),
		keys: z
			.array(z.string())
			.describe(
				'The primary keys of the items to trigger the flow on. If the flow requireSelection field is true, you must provide the keys.',
			),
		data: z
			.record(z.string(), z.any())
			.optional()
			.describe(
				'The data to pass to the flow. Should be an object with keys that match the flow *options.fields.fields* property',
			),
	}),

	handler: async (directus, input) => {
		try {
			const { flowDefinition, flowId, collection, keys, data } = input;

			// Validate flow existence
			if (!flowDefinition) {
				throw new Error('Flow definition must be provided');
			}

			// Validate flow ID matches
			if (flowDefinition.id !== flowId) {
				throw new Error(
					`Flow ID mismatch: provided ${flowId} but definition has ${flowDefinition.id}`,
				);
			}

			// Validate collection is valid for this flow
			if (!flowDefinition.options.collections.includes(collection)) {
				throw new Error(
					`Invalid collection "${collection}". This flow only supports: ${flowDefinition.options.collections.join(', ')}`,
				);
			}

			// Check if selection is required
			const requiresSelection =
				flowDefinition.options.requireSelection !== false;

			if (requiresSelection && (!keys || keys.length === 0)) {
				throw new Error(
					'This flow requires selecting at least one item, but no keys were provided',
				);
			}

			// Validate required fields
			if (flowDefinition.options.fields) {
				const requiredFields = flowDefinition.options.fields
					.filter((field: any) => field.meta?.required)
					.map((field: any) => field.field);

				for (const fieldName of requiredFields) {
					if (!data || !(fieldName in data)) {
						throw new Error(`Missing required field: ${fieldName}`);
					}
				}
			}

			// All validations passed, trigger the flow
			const result = await directus.request(
				triggerFlow('POST', flowId, { ...data, collection, keys }),
			);
			return formatSuccessResponse(result);
		}
		catch (error) {
			return formatErrorResponse(error);
		}
	},
});
