export type CollectionName = string;
export type FieldName = string;
export type Schema = Record<CollectionName, Record<FieldName, Field>>;

export interface Field {
	type: string | null;
	interface?: string | null | undefined;
	note?: string | null | undefined;
	primary_key?: boolean | null | undefined;
	required?: boolean | null | undefined;
	choices?: Record<string, string>[] | null | undefined;
	// Relationship details
	relation_type?: 'm2o' | 'o2m' | 'm2m' | 'm2a' | 'file' | 'files' | null | undefined;
	relation_collection?: string | string[] | null | undefined; // Collection(s) on the other side
	relation_meta?: Record<string, any> | null | undefined; // Stores the corresponding relation.meta object
}
