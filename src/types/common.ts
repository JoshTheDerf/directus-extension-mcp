import { z } from 'zod';

export const nullableString = () =>
	z.string().nullable().optional();

export const optionalString = () =>
	z.string().optional();

export const nullableNumber = () =>
	z.number().nullable().optional();

export const optionalNumber = () =>
	z.number().optional();

export const optionalBoolean = () =>
	z.boolean().optional();

export const nullableBoolean = () =>
	z.boolean().nullable().optional();

export const nullableRecord = () =>
	z.record(z.string(), z.any()).nullable().optional();

export const optionalStringArray = () =>
	z.array(z.string()).optional();

export const nullableStringArray = () =>
	z.array(z.string()).nullable().optional();

export const stringOrNumber = z.union([z.string(), z.number()]);
export const nullableStringOrNumber = stringOrNumber.nullable().optional();

export const stringNumberOrBoolean = z.union([z.string(), z.number(), z.boolean()]);
export const nullableStringNumberOrBoolean = stringNumberOrBoolean.nullable().optional();

export const fieldsParamSchema = nullableStringArray().describe('Specify fields to return. Supports dot notation and wildcards (*).');
export const sortParamSchema = nullableStringArray().describe('Fields to sort by (prefix with - for descending).');
export const limitParamSchema = nullableNumber().describe('Maximum number of items to return.');
export const offsetParamSchema = nullableNumber().describe('Number of items to skip.');
export const pageParamSchema = nullableNumber().describe('Page number for pagination.');
export const searchParamSchema = nullableString().describe('Global search term for root level text fields.');
