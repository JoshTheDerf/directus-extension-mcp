import * as z from "zod";
import { defineTool } from "../utils/define.js";
import { formatErrorResponse } from "../utils/response.js";

export function markdownToHtml(markdown: string, { DOMPurify, marked }: any) {
  return DOMPurify.sanitize(marked.parse(markdown));
}

export function htmlToMarkdown(html: string, { marked }: any) {
  return marked.parse(html);
}

export const markdownTool = defineTool("markdown-tool", {
  description: "Convert HTML to Markdown or Markdown to HTML.",
  annotations: {
    title: "Markdown Tool",
    readOnlyHint: true,
  },
  inputSchema: z
    .object({
      html: z
        .string()
        .optional()
        .describe("HTML string to convert to Markdown"),
      markdown: z
        .string()
        .optional()
        .describe("Markdown string to convert to HTML"),
    })
    .refine((data) => data.html || data.markdown, {
      message: "Either html or markdown must be provided",
      path: ["html", "markdown"],
    }),
  // @ts-expect-error - We're not using the directus client here
  handler: async (_directus, query) => {
    const ISOMORPHIC_DOMPURIFY = "isomorphic-dompurify";
    const MARKED = "marked";
    const packages = {
      DOMPurify: await import(ISOMORPHIC_DOMPURIFY),
      marked: await import(MARKED),
    };
    try {
      if (query.html) {
        return {
          content: [
            { type: "text", text: htmlToMarkdown(query.html, packages) },
          ],
        };
      }

      if (query.markdown) {
        return {
          content: [
            { type: "text", text: markdownToHtml(query.markdown, packages) },
          ],
        };
      }

      return formatErrorResponse(new Error("No input provided"));
    } catch (error) {
      return formatErrorResponse(error);
    }
  },
});
