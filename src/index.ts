import { defineEndpoint } from "@directus/extensions-sdk";
import { createConfig } from "./config";
import { authenticateDirectus, createDirectus } from "./directus";
import { getAvailablePrompts, handleGetPrompt } from "./prompts/handlers";
import { fetchPrompts } from "./prompts/index";
import { getTools } from "./tools/index";
import { fetchSchema } from "./utils/fetch-schema";
import { toMpcTools } from "./utils/to-mpc-tools";

async function importAll() {
  const packageRoot = "@modelcontextprotocol/sdk";
  const packages = {
    Server: await import(`${packageRoot}/server/index.js`).then(
      (m) => m.Server
    ),
    StreamableHTTPServerTransport: await import(
      `${packageRoot}/server/streamableHttp.js`
    ).then((m) => m.StreamableHTTPServerTransport),
    CallToolRequestSchema: await import(`${packageRoot}/types.js`).then(
      (m) => m.CallToolRequestSchema
    ),
    GetPromptRequestSchema: await import(`${packageRoot}/types.js`).then(
      (m) => m.GetPromptRequestSchema
    ),
    ListPromptsRequestSchema: await import(`${packageRoot}/types.js`).then(
      (m) => m.ListPromptsRequestSchema
    ),
    ListToolsRequestSchema: await import(`${packageRoot}/types.js`).then(
      (m) => m.ListToolsRequestSchema
    ),
  };
  return packages;
}

// Create a new MCP server instance for each request (stateless approach)
async function createMcpServer(req: any) {
  const {
    Server,
    StreamableHTTPServerTransport,
    CallToolRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListToolsRequestSchema,
  } = await importAll();

  // Fill in reasonable values as best as possible.
  const config = createConfig({
    DIRECTUS_TOKEN: req.query.access_token as string,
    DIRECTUS_URL:
      process.env.DIRECTUS_MCP_URL ||
      process.env.PUBLIC_URL ||
      "http://localhost:8055",
  });
  const directus = createDirectus(config);
  await authenticateDirectus(directus, config);
  const schema = await fetchSchema(directus);
  const prompts = await fetchPrompts(directus, config, schema);
  const availableTools = getTools(config);

  const server = new Server(
    {
      name: "Directus MCP Server",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
  });

  // Manage prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: getAvailablePrompts(prompts),
    };
  });

  // Get specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
    const promptName = request.params.name;
    const args = request.params.arguments || {};

    return await handleGetPrompt(directus, config, promptName, args);
  });

  // Manage tool requests
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    try {
      // Find the tool definition among ALL tools
      const tool = availableTools.find((definition) => {
        return definition.name === request.params.name;
      });

      if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      // Proceed with execution if permission check passes
      const { inputSchema, handler } = tool;
      const args = inputSchema.parse(request.params.arguments);
      return await handler(directus, args, {
        schema,
        baseUrl: config.DIRECTUS_URL,
      });
    } catch (error) {
      console.error("Error executing tool:", error);
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);

      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  });

  // Return the pre-filtered list for listing purposes
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: toMpcTools(availableTools) };
  });

  return { server, transport };
}

export default defineEndpoint((router) => {
  // Health check endpoint
  router.get("/", async (_req, res) => {
    try {
      res.json({
        status: "MCP Server is running",
        version: "0.0.1",
        capabilities: ["tools", "resources", "prompts"],
      });
    } catch (error) {
      res.status(500).json({
        error: "MCP Server initialization failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // MCP protocol endpoint - handle all MCP requests (stateless)
  router.post("/mcp", async (req, res) => {
    try {
      // Create a new instance of transport and server for each request
      // to ensure complete isolation and avoid request ID collisions
      // when multiple clients connect concurrently.
      const { server, transport } = await createMcpServer(req);

      // Clean up when request closes
      res.on("close", () => {
        console.log("MCP request closed");
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // Handle GET requests for stateless mode (method not allowed)
  router.get("/mcp", async (_req, res) => {
    console.log("Received GET MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      })
    );
  });

  // Handle DELETE requests for stateless mode (method not allowed)
  router.delete("/mcp", async (_req, res) => {
    console.log("Received DELETE MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      })
    );
  });
});
