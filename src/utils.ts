import { execa } from 'execa';

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a shell command and return the result
 */
export async function executeCommand(
  command: string,
  options: CommandOptions = {},
): Promise<CommandResult> {
  try {
    // Execute the command using execa
    const result = await execa('sh', ['-c', command], {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout,
      shell: true,
      all: true,
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr || '',
      exitCode: result.exitCode,
    };
  } catch (error) {
    if (error instanceof Error && 'exitCode' in error && 'stdout' in error && 'stderr' in error) {
      // This is an execa error with command output
      return {
        stdout: (error as any).stdout || '',
        stderr: (error as any).stderr || '',
        exitCode: (error as any).exitCode || 1,
      };
    }

    // Re-throw other errors
    throw error;
  }
}
