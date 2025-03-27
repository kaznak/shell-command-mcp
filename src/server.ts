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
    async ({ command, workingDir, env, timeout }) => {
      try {
        const result = await executeCommand(command, {
          cwd: workingDir,
          env,
          timeout,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
              }, null, 2),
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

  // Register ls tool (convenience wrapper around execute-command)
  server.tool(
    'ls',
    'List directory contents',
    {
      path: z.string().optional().describe('Path to list (defaults to current directory)'),
      options: z.string().optional().describe('Additional ls command options'),
    },
    async ({ path = '.', options = '-la' }) => {
      try {
        const command = `ls ${options} ${path}`;
        const result = await executeCommand(command);

        return {
          content: [
            {
              type: 'text',
              text: result.stdout,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error listing directory: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // Register find tool
  server.tool(
    'find',
    'Find files and directories',
    {
      path: z.string().describe('Starting path for search'),
      pattern: z.string().describe('Search pattern'),
      type: z.enum(['f', 'd', 'l']).optional().describe('Type to find: f (file), d (directory), l (symlink)'),
    },
    async ({ path, pattern, type }) => {
      try {
        let command = `find ${path} -name "${pattern}"`;
        if (type) {
          command += ` -type ${type}`;
        }
        
        const result = await executeCommand(command);

        return {
          content: [
            {
              type: 'text',
              text: result.stdout,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error finding files: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // Register kubectl tool
  server.tool(
    'kubectl',
    'Execute kubectl commands',
    {
      args: z.string().describe('kubectl arguments'),
      kubeconfig: z.string().optional().describe('Path to kubeconfig file'),
    },
    async ({ args, kubeconfig }) => {
      try {
        const env: Record<string, string> = {};
        if (kubeconfig) {
          env.KUBECONFIG = kubeconfig;
        }

        const result = await executeCommand(`kubectl ${args}`, { env });

        return {
          content: [
            {
              type: 'text',
              text: result.stdout || result.stderr,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing kubectl: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // Register helm tool
  server.tool(
    'helm',
    'Execute helm commands',
    {
      args: z.string().describe('helm arguments'),
      kubeconfig: z.string().optional().describe('Path to kubeconfig file'),
    },
    async ({ args, kubeconfig }) => {
      try {
        const env: Record<string, string> = {};
        if (kubeconfig) {
          env.KUBECONFIG = kubeconfig;
        }

        const result = await executeCommand(`helm ${args}`, { env });

        return {
          content: [
            {
              type: 'text',
              text: result.stdout || result.stderr,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing helm: ${error instanceof Error ? error.message : String(error)}`,
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