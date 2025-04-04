import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setTool as setSyncTool } from './execute-bash-script-sync.js';
import { setTool as setAsyncTool } from './execute-bash-script-async.js';

// Create an MCP server
export const server = new McpServer({
  name: 'shell-command-mcp',
  // TODO change to llm-workspace or something
  version: '1.0.0',
});

setSyncTool(server);
setAsyncTool(server);

async function main() {
  try {
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Shell Command MCP Server started');
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

main();
