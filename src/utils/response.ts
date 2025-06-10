import type { DirectusApiError } from './is-directus-error.js';
import { isDirectusError } from './is-directus-error.js';

/**
 * Format a success response for the MCP server.
 * @param data - The data to format.
 * @param message - The message to send to the user.
 * @returns The formatted success response.
 */
export const formatSuccessResponse = (data: unknown, message?: string) => {
	if (message) {
		const formatted = `<data>\n${JSON.stringify(data, null, 2)}\n</data>\n<message>\n${message}\n</message>`;
		return {
			content: [{ type: 'text' as const, text: `${formatted}` }],
		};
	}

	return {
		content: [
			{ type: 'text' as const, text: `${JSON.stringify(data, null, 2)}` },
		],
	};
};

/**
 * Format an error response for the MCP server.
 * @param error - The error to format.
 */
export const formatErrorResponse = (error: unknown) => {
	let errorPayload: Record<string, unknown>;

	if (isDirectusError(error)) {
		// Handle Directus API errors
		errorPayload = {
			directusApiErrors: error.errors.map((e: DirectusApiError) => ({
				message: e.message || 'Unknown error',
				code: e.extensions?.code,
			})),
		};
	}
	else {
		// Handle generic errors
		let message = 'An unknown error occurred.';
		let code: string | undefined;

		if (error instanceof Error) {
			message = error.message;
			code = 'code' in error ? String(error.code) : undefined;
		}
		else if (typeof error === 'object' && error !== null) {
			message = 'message' in error ? String(error.message) : message;
			code = 'code' in error ? String(error.code) : undefined;
		}
		else if (typeof error === 'string') {
			message = error;
		}

		errorPayload = { error: message, ...(code && { code }) };
	}

	return {
		isError: true,
		content: [{ type: 'text' as const, text: JSON.stringify(errorPayload) }],
	};
};

/**
 * Format a response containing a single embedded resource for the MCP server,
 * handling both text and binary content according to the MCP specification.
 *
 * @param uri - The full URI for the resource (e.g., "resource://my-data/123", "file:///path/to/file.txt").
 * @param mimeType - The MIME type of the resource content (e.g., "application/json", "text/plain", "image/png").
 * @param contentString - The resource content. For text resources, this is the plain text. For binary resources, this MUST be the Base64 encoded string.
 * @param isBinary - Set to true if the contentString is Base64 encoded binary data, false or undefined for text.
 * @param size - Optional size of the original resource in bytes.
 * @returns The formatted response object suitable for returning from an MCP tool or resource handler.
 */
export const formatResourceResponse = (
	uri: string,
	mimeType: string,
	contentString: string,
	isBinary?: boolean,
	size?: number,
) => {
	const resourceBase = {
		uri,
		mimeType,
		...(size !== undefined && { size }), // Conditionally add size if provided
	};

	const resource = isBinary
		? {
				...resourceBase,
				blob: contentString, // Use 'blob' field for base64 binary data
			}
		: {
				...resourceBase,
				text: contentString, // Use 'text' field for textual data
			};

	return {
		content: [
			{
				type: 'resource' as const,
				resource,
			},
		],
	};
};
