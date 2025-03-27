import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeCommand } from './utils.js';

// Create an MCP server
export const server = new McpServer({
  name: 'shell-command-mcp',
  version: '1.0.0',
});

// Execute a shell command
server.tool(
  'execute-command',
  {
    command: z.string(),
    options: z.object({
      cwd: z.string().optional(),
      env: z.record(z.string(), z.string()).optional(),
      timeout: z.number().int().positive().optional(),
    }),
  },
  async ({ command, options }) => ({
    content: [executeCommand(command, options)],
  }),
);
