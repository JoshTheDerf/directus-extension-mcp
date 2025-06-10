export interface DirectusApiError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}

export interface DirectusError {
	errors: DirectusApiError[];
	response: Response;
}

/**
 * A type guard to check if an error is a Directus API error
 */
export function isDirectusError(error: unknown): error is DirectusError {
	return (
		typeof error === 'object'
		&& error !== null
		&& 'errors' in error
		&& Array.isArray(error.errors)
		&& 'message' in error.errors[0]
		&& 'extensions' in error.errors[0]
		&& 'code' in error.errors[0].extensions
	);
}
