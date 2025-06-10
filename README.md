# Directus MCP Server Extension

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) is a standard for helping AI tools and
LLMs talk to applications and services like Directus.

The Directus Content MCP Server extension allows any MCP client to connect to your Directus instance. Some good use cases are:

- **Content Editors**: build custom pages, write blog posts, update content, organize assets and more inside your
  Directus project.
- **Data Analysts**: query collections, generate reports, analyze trends, and extract insights from your Directus data
  using natural language.

It intentionally limits destructive actions that would result in really bad outcomes like data loss from deleting fields
or deleting collections.

> **Note**: This extension is derived from the [official Directus MCP implementation](https://github.com/directus/mcp) and has been adapted to work as a Directus extension with HTTP streaming support, eliminating the need for separate server setup and environment variable configuration.

## Installation

### Prerequisites

- An existing Directus project

If you don't have an existing Directus project, you can get started with a free trial on
[Directus Cloud](https://directus.cloud/register) at https://directus.cloud/register

OR

You can spin up a sample Directus instance locally with the following terminal command.

```
npx directus-template-cli@latest init
```

### Step 1. Get Directus Credentials

You can use email and password or generate a static token to connect the MCP to your Directus instance.

To get a static access token:

1. Login to your Directus instnace
2. Go to the User Directory and choose your own user profile
3. Scroll down to the Token field
4. Generate token and copy it
5. Save the user (do NOT forget to save because you’ll get an error that shows Invalid token!)

### Step 2. Configure the MCP in your AI Tool

#### Claude Desktop (Remote Connection)

If your Claude Desktop supports remote MCP connections, you can connect directly:

1. Open [Claude Desktop](https://claude.ai/download) and navigate to Settings.

2. Under the Developer tab, click Edit Config to open the configuration file.

3. Add the following configuration:

   ```json
   {
   	"mcpServers": {
   		"directus": {
   			"url": "https://YOUR_DIRECTUS_URL/directus-extension-mcp/mcp?access_token=YOUR_ACCESS_TOKEN"
   		}
   	}
   }
   ```

   Make sure you replace `YOUR_DIRECTUS_URL` with your Directus instance URL and `YOUR_ACCESS_TOKEN` with your access token.

4. Save the configuration file and restart Claude desktop.

5. From the new chat screen, you should see the Directus MCP server appear.

#### Using mcp-remote for Clients Without Native Remote Support

If your MCP client doesn't support remote connections natively, you can use `mcp-remote` as a bridge:

1. Configure your MCP client to use mcp-remote:

   **For Claude Desktop:**
   ```json
   {
   	"mcpServers": {
   		"directus": {
   			"command": "npx",
   			"args": [
   				"mcp-remote",
   				"https://YOUR_DIRECTUS_URL/directus-extension-mcp/mcp?access_token=YOUR_ACCESS_TOKEN"
   			]
   		}
   	}
   }
   ```

   **For Cursor:**
   ```json
   {
   	"mcpServers": {
   		"directus": {
   			"command": "npx",
   			"args": [
   				"mcp-remote",
   				"https://YOUR_DIRECTUS_URL/directus-extension-mcp/mcp?access_token=YOUR_ACCESS_TOKEN"
   			]
   		}
   	}
   }
   ```

   Make sure you replace `YOUR_DIRECTUS_URL` with your Directus instance URL and `YOUR_ACCESS_TOKEN` with your access token.

2. Save the configuration file and restart your MCP client.

4. The server should now be connected and available for use.

## Tools

The MCP Server provides the following tools to interact with your Directus instance:

| Tool                 | Description                                          | Use Cases                                                      |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **system-prompt**    | Provides context to the LLM assistant about its role | Start of a session to understand the system context            |
| **users-me**         | Get current user information                         | Understanding permissions, personalizing responses             |
| **read-collections** | Retrieve the schema of all collections               | Exploring database structure, understanding relationships      |
| **read-items**       | Fetch items from any collection                      | Retrieving content, searching for data, displaying information |
| **create-item**      | Create new items in collections                      | Adding new content, records, or entries                        |
| **update-item**      | Modify existing items                                | Editing content, updating statuses, correcting information     |
| **delete-item**      | Remove items from collections                        | Cleaning up outdated content                                   |
| **read-files**       | Access file metadata or raw content                  | Finding images, documents, or media assets                     |
| **import-file**      | Import files from URLs                               | Adding external media to your Directus instance                |
| **update-files**     | Update file metadata                                 | Organizing media, adding descriptions, tagging                 |
| **read-fields**      | Get field definitions for collections                | Understanding data structure, field types and validation       |
| **read-field**       | Get specific field information                       | Detailed field configuration                                   |
| **create-field**     | Add new fields to collections                        | Extending data models                                          |
| **update-field**     | Modify existing fields                               | Changing field configuration, interface options                |
| **read-flows**       | List available automation flows                      | Finding automation opportunities                               |
| **trigger-flow**     | Execute automation flows                             | Bulk operations, publishing, status changes                    |
| **read-comments**    | View comments on items                               | Retrieving feedback, viewing discussion threads                |
| **upsert-comment**   | Add or update comments                               | Providing feedback, documenting decisions                      |
| **markdown-tool**    | Convert between markdown and HTML                    | Content formatting for WYSIWYG fields                          |
| **get-prompts**      | List available prompts                               | Discovering pre-configured prompt templates                    |
| **get-prompt**       | Execute a stored prompt                              | Using prompt templates for consistent AI interactions          |

### System Prompt

The MCP server comes with a system prompt that helps encourage the right tool use and provides guiderails for the LLM.
You can overwrite the default system prompt by setting the `MCP_SYSTEM_PROMPT` environment variable in your Directus server configuration (.env file or similar).

You can also disable the system prompt entirely if desired.

Just set `MCP_SYSTEM_PROMPT_ENABLED` to `false` in your Directus server environment variables.

### Prompt Configuration

The MCP server supports dynamic prompts stored in a Directus collection. Prompts are not widely supported across MCP
Clients, but Claude Desktop does have support for them.

You can configure the following environment variables in your Directus server configuration:

- `DIRECTUS_PROMPTS_COLLECTION_ENABLED`: Set to "true" to enable prompt functionality
- `DIRECTUS_PROMPTS_COLLECTION`: The name of the collection containing prompts
- `DIRECTUS_PROMPTS_NAME_FIELD`: Field name for the prompt name (default: "name")
- `DIRECTUS_PROMPTS_DESCRIPTION_FIELD`: Field name for the prompt description (default: "description")
- `DIRECTUS_PROMPTS_SYSTEM_PROMPT_FIELD`: Field name for the system prompt text (default: "system_prompt")
- `DIRECTUS_PROMPTS_MESSAGES_FIELD`: Field name for the messages array (default: "messages")

### Mustache Templating

Both system prompts and message content support mustache templating using the `{{ variable_name }}` syntax:

1. Define variables in your prompts using double curly braces: `Hello, {{ name }}!`
2. When calling a prompt, provide values for the variables in the `arguments` parameter
3. The MCP server will automatically replace all variables with their provided values

## 🙏 Thanks To

- [@rijkvanzanten](https://github.com/rijkvanzanten) for the initial experiment
- The Directus team for releasing an official open-source MCP integration
- Claude Sonnet 4 for helping me rework the extension and add HTTP support.

## License

MIT
