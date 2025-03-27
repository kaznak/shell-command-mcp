import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeCommand } from './utils.js';

export async function startServer(): Promise<void> {
  // Create MCP server instance
  const server = new Server(
    {
      name: 'shell-command-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register shell command execution tool
  server.setRequestHandler(
    {
      method: 'tools/call',
      params: z.object({
        name: z.literal('execute-command'),
        arguments: z.object({
          command: z.string().describe('The shell command to execute'),
          workingDir: z.string().optional().describe('Working directory for command execution'),
          env: z.record(z.string()).optional().describe('Environment variables for the command'),
          timeout: z.number().optional().describe('Timeout in milliseconds'),
        }),
      }),
    },
    async (request) => {
      try {
        const { command, workingDir, env, timeout } = request.params.arguments;

        const result = await executeCommand(command, {
          cwd: workingDir,
          env,
          timeout,
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
