import type { Directus } from '../directus.js';

import type { UserPermissionsData } from '../types/permissions.js';
import { readUserPermissions } from '@directus/sdk';

/**
 * Fetches the current user's permissions from the Directus API.
 * @param directus - The Directus instance.
 * @returns The current user's permissions.
 */
export async function fetchCurrentUserPermissions(directus: Directus): Promise<UserPermissionsData> {
	const permissions = await directus.request<UserPermissionsData>(
		readUserPermissions(),
	);

	return permissions;
}
