import { z } from 'zod';
import { nullableNumber, nullableString } from './common.js';

export const FileSchema = z.object({
	id: z.string().describe('The ID of the file to update.'),
	title: nullableString().describe('The name of the file.'),
	folder: nullableString().describe('The ID of the folder the file is in.'),
	description: nullableString().describe(
		'The description of the file. Often used as the alt text on a website',
	),
	location: nullableString().describe(
		'The location of where the photo was taken.',
	),
	tags: z.array(z.string()).optional().describe('The tags of the file.'),
	focal_point_x: nullableNumber().describe(
		'The x coordinate of the focal point of the file in pixels.',
	),
	focal_point_y: nullableNumber().describe(
		'The y coordinate of the focal point of the file.',
	),
	filename_download: nullableString().describe(
		'The filename of the file when users download it.',
	),
});
export type FileSchemaType = z.infer<typeof FileSchema>;
