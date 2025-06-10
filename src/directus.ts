import type {
	AuthenticationClient,
	DirectusClient,
	RestClient,
} from '@directus/sdk';
import type { Config } from './config.js';
import type { Schema } from './types/schema.js';
import {
	authentication,
	createDirectus as createSdk,
	rest,
} from '@directus/sdk';

export type Directus = DirectusClient<Schema> &
	RestClient<Schema> &
	AuthenticationClient<Schema>;

/**
 * Create a Directus client.
 * @param config - The configuration.
 * @returns The Directus client.
 */
export const createDirectus = (config: Config) =>
	createSdk(config.DIRECTUS_URL).with(authentication()).with(rest());

/**
 * Authenticate the Directus client.
 * @param directus - The Directus client.
 * @param config - The configuration.
 */
export async function authenticateDirectus(directus: Directus, config: Config) {
	if (!directus || !config) {
		throw new Error('Directus or config is not defined');
	}

	// Token-based authentication
	if (config.DIRECTUS_TOKEN) {
		directus.setToken(config.DIRECTUS_TOKEN);
		return;
	}

	// Credentials-based authentication
	if (config.DIRECTUS_USER_EMAIL && config.DIRECTUS_USER_PASSWORD) {
		try {
			await directus.login(
				config.DIRECTUS_USER_EMAIL,
				config.DIRECTUS_USER_PASSWORD,
			);

			return;
		}
		catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to authenticate with credentials: ${errorMessage}`,
			);
		}
	}

	// No valid authentication method
	throw new Error(
		'No valid authentication method provided (requires either DIRECTUS_TOKEN or both DIRECTUS_USER_EMAIL and DIRECTUS_USER_PASSWORD)',
	);
}
