import * as z from 'zod';
import { defineTool } from '../utils/define.js';

export default defineTool('read-collections', {
	description:
		'Retrieve the schema of the connected Directus instance. This is a short hand schema to reduce the tokens used for the LLM. The fields will not match the return type of the fields from the Directus API. If you need the exact fields definitions from the Directus API, use the read-fields tool.',
	inputSchema: z.object({}),
	handler: async (_directus, _args, { schema }) => {
		return { content: [{ type: 'text', text: JSON.stringify(schema) }] };
	},
});
