/**
 * Recursively removes properties with null or undefined values from an object or array.
 * @param obj The input object or array.
 * @returns A new object or array with null/undefined properties/elements removed, or the original value if not an object/array.
 */
export function stripNullUndefined<T>(obj: T): T | undefined {
	if (obj === null || obj === undefined) {
		return undefined;
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		const newArr = obj.reduce<any[]>((acc, item) => {
			const processed = stripNullUndefined(item);

			if (processed !== undefined) {
				acc.push(processed);
			}

			return acc;
		}, []);

		return newArr.length > 0 ? newArr as T : undefined;
	}

	// Handle objects (excluding Date and other special objects)
	if (typeof obj === 'object' && !(obj instanceof Date)
		&& !(obj instanceof RegExp) && !(obj instanceof Map)
		&& !(obj instanceof Set) && !(obj instanceof Error)) {
		const newObj: Record<string, any> = {};
		let hasKeys = false;

		for (const key of Object.keys(obj)) {
			const value = stripNullUndefined(obj[key as keyof T]);

			if (value !== undefined) {
				newObj[key] = value;
				hasKeys = true;
			}
		}

		return hasKeys ? newObj as T : undefined;
	}

	return obj;
}
