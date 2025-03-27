import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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

  // Register tools listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'execute-command',
          description: 'Execute a shell command',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The shell command to execute',
              },
              workingDir: {
                type: 'string',
                description: 'Working directory for command execution',
              },
              env: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                description: 'Environment variables for the command',
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
              },
            },
            required: ['command'],
          },
        },
      ],
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'execute-command') {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    try {
      const { command, workingDir, env, timeout } = request.params.arguments as {
        command: string;
        workingDir?: string;
        env?: Record<string, string>;
        timeout?: number;
      };

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
  });

  // Connect to transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
