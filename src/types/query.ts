import { z } from 'zod';

import {
	fieldsParamSchema,
	limitParamSchema,
	nullableBoolean,
	nullableNumber,
	nullableString,
	nullableStringArray,
	nullableStringNumberOrBoolean,
	offsetParamSchema,
	optionalBoolean,
	optionalString,
	optionalStringArray,
	pageParamSchema,
	searchParamSchema,
	sortParamSchema,
	stringOrNumber,
} from './common.js';

export const aggregateSchema = z.object({
	avg: optionalStringArray().describe('Average of fields.'),
	avgDistinct: optionalStringArray().describe('Average of distinct fields.'),
	count: optionalStringArray().describe('Count of fields.'),
	countDistinct: optionalStringArray().describe('Count of distinct fields.'),
	sum: optionalStringArray().describe('Sum of fields.'),
	sumDistinct: optionalStringArray().describe('Sum of distinct fields.'),
	min: optionalStringArray().describe('Minimum value of fields.'),
	max: optionalStringArray().describe('Maximum value of fields.'),
}).describe('Aggregation operations to perform.');

export const fieldFilterOperatorSchema = z.object({
	_eq: nullableStringNumberOrBoolean.describe('Equals'),
	_neq: nullableStringNumberOrBoolean.describe('Not equals'),
	_lt: stringOrNumber.optional().describe('Less than'),
	_lte: stringOrNumber.optional().describe('Less than or equal to'),
	_gt: stringOrNumber.optional().describe('Greater than'),
	_gte: stringOrNumber.optional().describe('Greater than or equal to'),
	_in: z.array(stringOrNumber).optional().describe('In array'),
	_nin: z.array(stringOrNumber).optional().describe('Not in array'),
	_null: optionalBoolean().describe('Is null'),
	_nnull: optionalBoolean().describe('Is not null'),
	_contains: optionalString().describe('Contains substring (case-sensitive)'),
	_ncontains: optionalString().describe('Does not contain substring (case-sensitive)'),
	_icontains: optionalString().describe('Contains substring (case-insensitive)'),
	_starts_with: optionalString().describe('Starts with (case-sensitive)'),
	_nstarts_with: optionalString().describe('Does not start with (case-sensitive)'),
	_istarts_with: optionalString().describe('Starts with (case-insensitive)'),
	_nistarts_with: optionalString().describe('Does not start with (case-insensitive)'),
	_ends_with: optionalString().describe('Ends with (case-sensitive)'),
	_nends_with: optionalString().describe('Does not end with (case-sensitive)'),
	_iends_with: optionalString().describe('Ends with (case-insensitive)'),
	_niends_with: optionalString().describe('Does not end with (case-insensitive)'),
	_between: z.array(stringOrNumber).optional().describe('Between two values'),
	_nbetween: z.array(stringOrNumber).optional().describe('Not between two values'),
	_empty: optionalBoolean().describe('Is empty'),
	_nempty: optionalBoolean().describe('Is not empty'),
	_intersects: optionalString().describe('Geometry intersects (GeoJSON)'),
	_nintersects: optionalString().describe('Geometry does not intersect (GeoJSON)'),
	_intersects_bbox: optionalString().describe('Geometry intersects bounding box (GeoJSON)'),
	_nintersects_bbox: optionalString().describe('Geometry does not intersect bounding box (GeoJSON)'),
}).partial().describe('Operators for field filtering.');

export const fieldValidationOperatorSchema = z.object({
	_submitted: optionalBoolean().describe('Is submitted (relevant for validation)'),
	_regex: optionalString().describe('Matches regex pattern'),
}).partial().describe('Operators for field validation.');

export const fieldFilterSchema = z.record(
	z.string(),
	z.union([fieldFilterOperatorSchema, fieldValidationOperatorSchema]),
).describe('Record of field filters.');

export const filterSchema = z.union([
	z.interface({
		get _or() {
			return z.array(filterSchema).describe('Logical OR condition.');
		},
	}),
	z.interface({
		get _and() {
			return z.array(filterSchema).describe('Logical AND condition.');
		},
	}),
	fieldFilterSchema,
]).describe('Recursive filter structure (including logical AND/OR).');

export const deepQuerySchema = z.object({
	_fields: nullableStringArray().describe('Fields for deep query.'),
	_sort: nullableStringArray().describe('Sort order for deep query.'),
	_filter: filterSchema.optional().nullable().describe('Filter for deep query.'),
	_limit: nullableNumber().describe('Limit for deep query.'),
	_offset: nullableNumber().describe('Offset for deep query.'),
	_page: nullableNumber().describe('Page for deep query.'),
	_search: nullableString().describe('Search term for deep query.'),
	_group: nullableStringArray().describe('Grouping fields for deep query.'),
	_aggregate: aggregateSchema.optional().nullable().describe('Aggregation for deep query.'),
}).describe('Schema for a deep query on a relation.');

export const nestedDeepQuerySchema = z.record(z.string(), deepQuerySchema).optional().nullable().describe('Nested deep query for relational fields.');

export const filterParamSchema = filterSchema.optional().nullable().describe('Filter conditions for the query. Respects all standard Directus filter syntax.');

export const versionParamSchema = nullableString().describe('Content version to retrieve.');

export const versionRawParamSchema = nullableBoolean().describe('Whether to return raw version data.');

export const exportParamSchema = z.union([z.literal('json'), z.literal('csv'), z.literal('xml'), z.literal('yaml')]).optional().nullable().describe('Format to export the data.');

export const groupByParamSchema = nullableStringArray().describe('Fields to group results by.');

export const aggregateParamSchema = aggregateSchema.optional().nullable().describe('Aggregation operations to perform on the main query.');

export const aliasParamSchema = z.record(z.string(), z.string()).optional().nullable().describe('Field aliases for the response.');

export const metaParamSchema = z.union([z.literal('total_count'), z.literal('filter_count')]).optional().nullable().describe('Include collection counts in the response.');

export const itemQuerySchema = z.object({
	fields: fieldsParamSchema,
	sort: sortParamSchema,
	filter: filterParamSchema,
	limit: limitParamSchema,
	offset: offsetParamSchema,
	page: pageParamSchema,
	search: searchParamSchema,
	version: versionParamSchema,
	export: exportParamSchema,
	groupBy: groupByParamSchema,
	aggregate: aggregateParamSchema,
	deep: nestedDeepQuerySchema,
	alias: aliasParamSchema,
	meta: metaParamSchema,
}).describe('Main Directus item query parameters.');

export type FieldFilterOperator = z.infer<typeof fieldFilterOperatorSchema>;
export type FieldValidationOperator = z.infer<typeof fieldValidationOperatorSchema>;
export interface FieldFilter {
	[field: string]: FieldFilterOperator | FieldValidationOperator;
}
export interface LogicalFilterOR {
	_or: z.infer<typeof filterSchema>[];
}
export interface LogicalFilterAND {
	_and: z.infer<typeof filterSchema>[];
}
export type LogicalFilter = LogicalFilterOR | LogicalFilterAND;
export type Filter = LogicalFilter | FieldFilter;

export { fieldsParamSchema, limitParamSchema, offsetParamSchema, pageParamSchema, searchParamSchema, sortParamSchema } from './common.js';
