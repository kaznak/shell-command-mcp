import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';

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
