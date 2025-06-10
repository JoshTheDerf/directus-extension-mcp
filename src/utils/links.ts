/**
 * Types of resources that can be linked to in the CMS
 */
export type CmsResourceType = 'item' | 'collection' | 'file' | 'user' | 'visual';

/**
 * Configuration for generating CMS deep links
 */
interface LinkConfig {
	baseUrl: string;
	type: CmsResourceType;
	collection?: string;
	id?: string;
	file?: string;
	user?: string;
	url?: string;
}

/**
 * Base function to generate CMS deep links based on resource type
 * @param config - Configuration for the link
 * @returns A deep link or undefined if required parameters are missing
 */
export const generateCmsLink = (config: Partial<LinkConfig>): string | undefined => {
	const { baseUrl, type, collection, id, file, user, url } = config;

	if (!baseUrl) {
		return undefined;
	}

	switch (type) {
		case 'item':
			if (!collection || !id) return undefined;
			return `${baseUrl}/admin/content/${collection}/${id}`;

		case 'collection':
			if (!collection) return undefined;
			return `${baseUrl}/admin/content/${collection}`;

		case 'file':
			if (!file) return undefined;
			return `${baseUrl}/admin/content/files/${file}`;

		case 'user':
			if (!user) return undefined;
			return `${baseUrl}/admin/content/users/${user}`;

		case 'visual':
			if (!url) return undefined;

			try {
				// Ensure url is a valid URL and not a relative path
				const urlObj = new URL(url);
				// Set visual-editing=true in query params while keeping other params
				urlObj.searchParams.set('visual-editing', 'true');
				return `${baseUrl}/admin/visual/${urlObj.toString()}`;
			}
			catch {
				// Handle invalid URLs
				return undefined;
			}

		default:
			return undefined;
	}
};
