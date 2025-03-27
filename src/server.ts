import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeCommand } from './utils.js';

export async function startServer(): Promise<void> {
  // Create MCP server instance
  const server = new McpServer({
    name: 'shell-command-mcp',
    version: '1.0.0',
  });

  // Register shell command execution tool
  server.tool(
    'execute-command',
    'Execute a shell command',
    {
      command: z.string().describe('The shell command to execute'),
      workingDir: z.string().optional().describe('Working directory for command execution'),
      env: z.record(z.string()).optional().describe('Environment variables for the command'),
      timeout: z.number().optional().describe('Timeout in milliseconds'),
    },
    async (params: {
      command: string;
      workingDir?: string;
      env?: Record<string, string>;
      timeout?: number;
    }) => {
      try {
        const result = await executeCommand(params.command, {
          cwd: params.workingDir,
          env: params.env,
          timeout: params.timeout,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  stdout: result.stdout,
                  stderr: result.stderr,
                  exitCode: result.exitCode,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        // Handle command execution errors
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing command: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // Connect to transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
