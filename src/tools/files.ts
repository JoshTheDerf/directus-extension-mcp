import {
  importFile,
  readAssetArrayBuffer,
  readFile,
  readFiles,
  readFolders,
  updateFilesBatch,
} from "@directus/sdk";
import { z } from "zod";
import { FileSchema } from "../types/files.js";

import { itemQuerySchema } from "../types/query.js";
import { defineTool } from "../utils/define.js";
import {
  formatErrorResponse,
  formatResourceResponse,
  formatSuccessResponse,
} from "../utils/response.js";

export const readFilesTool = defineTool("read-files", {
  description:
    "Read file (asset) metadata. Provide a query to list multiple files' metadata. Provide 'id' to get a single file's metadata. Provide 'id' and 'raw: true' to get a single file's raw content (Base64 encoded).",
  annotations: {
    title: "Read Files",
    readOnlyHint: true,
  },
  inputSchema: z.object({
    query: itemQuerySchema
      .optional()
      .describe(
        "Directus query parameters (filter, sort, fields, limit, deep, etc.) for file metadata."
      ),
    id: z
      .string()
      .optional()
      .describe("The ID of the specific file. Omit to retrieve all files."),
    raw: z
      .boolean()
      .optional()
      .describe(
        "If true, fetch raw file content (requires 'id'). Content will be Base64 encoded and returned in the 'blob' field with the correct MIME type."
      ),
  }),

  handler: async (directus, input) => {
    try {
      const NODE_BUFFER = "node:buffer";
      const Buffer = await import(NODE_BUFFER).then((mod) => mod.Buffer);
      // Case 1: Get a single file (with or without raw content)
      if (input.id) {
        // Default to all fields if raw to ensure we get type and filename
        const fieldsForMetadata = input.raw ? ["*"] : input.query?.fields;

        const query = fieldsForMetadata
          ? { fields: fieldsForMetadata }
          : undefined;

        const metadata = await directus.request(readFile(input.id, query));

        if (!metadata) {
          return formatErrorResponse(`File with ID ${input.id} not found.`);
        }

        // If raw content requested, get base64 (usually for image analysis or vision tool use)
        if (input.raw) {
          // Check if this is an image and if we have dimensions
          const isImage = metadata["type"]?.toString().startsWith("image/");
          const width = Number(metadata["width"]) || 0;
          const height = Number(metadata["height"]) || 0;

          // If image exceeds 1200px in any dimension, apply resize parameter
          let assetRequest;

          if (isImage && (width > 1200 || height > 1200)) {
            // Calculate which dimension to constrain
            const transforms =
              width > height
                ? [["resize", { width: 800, fit: "contain" }]]
                : [["resize", { height: 800, fit: "contain" }]];

            assetRequest = readAssetArrayBuffer(input.id, {
              transforms: transforms as [string, ...any[]][],
            });
          } else {
            assetRequest = readAssetArrayBuffer(input.id);
          }

          const fileData = await directus.request<ArrayBuffer>(assetRequest);
          const fileBuffer = Buffer.from(fileData);
          const base64Content = fileBuffer.toString("base64");
          const sizeInBytes = fileBuffer.byteLength;

          // The fallback here is janky and certain to fail if the asset is missing a type and it's not an image. Should we just throw an errror?
          const mimeType = metadata["type"] || "image/jpeg";

          return formatResourceResponse(
            `directus://files/${input.id}/raw`,
            mimeType as string,
            base64Content,
            true,
            sizeInBytes
          );
        }

        return formatSuccessResponse(metadata);
      }

      // Case 2: Query all files
      const files = await directus.request(
        input.query ? readFiles(input.query) : readFiles()
      );
      return formatSuccessResponse(files);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },
});

export const updateFilesTool = defineTool("update-files", {
  description: "Update the metadata of existing file(s) in Directus.",
  annotations: {
    title: "Update Files",
  },
  inputSchema: z.object({
    data: z
      .array(FileSchema)
      .describe(
        "An array of objects containing the id and fields to update (e.g., title, description, tags, folder)."
      ),
  }),
  handler: async (directus, input) => {
    try {
      if (Object.keys(input.data).length === 0) {
        return formatErrorResponse(
          "The 'data' object cannot be empty. Provide at least one field to update."
        );
      }

      const result = await directus.request(updateFilesBatch(input.data));
      return formatSuccessResponse(result);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },
});

export const importFileTool = defineTool("import-file", {
  description:
    "Import a file to Directus from a web URL. Optionally include 'data' for file metadata (title, folder, etc.).",
  annotations: {
    title: "Import File",
  },
  inputSchema: z.object({
    url: z.string().describe("URL of the file to import."),
    data: FileSchema,
  }),
  handler: async (directus, input) => {
    try {
      const result = await directus.request(
        importFile(input.url, input.data || {})
      );
      return formatSuccessResponse(result);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },
});

export const readFoldersTool = defineTool("read-folders", {
  description: "Read the metadata of existing folders in Directus.",
  annotations: {
    title: "Read Folders",
  },
  inputSchema: z.object({
    query: itemQuerySchema.optional(),
  }),
  handler: async (directus, input) => {
    try {
      const result = await directus.request(readFolders(input.query));
      return formatSuccessResponse(result);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },
});
