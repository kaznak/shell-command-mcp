import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setTool } from './execute-bash-script.js';

// Create an MCP server
export const server = new McpServer({
  name: 'shell-command-mcp',
  // TODO change to llm-workspace or something
  version: '1.0.0',
});

setTool(server);
