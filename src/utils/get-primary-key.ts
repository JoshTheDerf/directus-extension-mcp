/**
 * Gets the primary key field name for a specified collection
 * @param collection The collection name to get the primary key for
 * @param schema The collections schema object containing field definitions
 * @returns The name of the primary key field or null if not found
 */
export function getPrimaryKeyField(
	collection: string,
	schema: Record<string, Record<string, any>>,
): string | null {
	// Check if collection exists in schema
	if (!schema[collection]) {
		return null;
	}

	// Find the field that has primary_key: true
	for (const [fieldName, fieldConfig] of Object.entries(schema[collection])) {
		if (fieldConfig.primary_key === true) {
			return fieldName;
		}
	}

	return null;
}
