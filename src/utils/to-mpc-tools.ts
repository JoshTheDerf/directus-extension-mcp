import type { ToolDefinition } from '../types/tool.js';
import { z } from 'zod';

export const toMpcTools = (defs: ToolDefinition<any>[]) => {
	return defs.map((def) => ({
		name: def.name,
		description: def.description,
		inputSchema: z.toJSONSchema(def.inputSchema, { reused: 'ref' }),
		annotations: def.annotations,
	}));
};
