import { spawn } from 'child_process';

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
 * Execute a command using bash and return the result
 * 
 * Each command execution spawn a new bash process.
 * This implementation causes overhead but is simple and isolated.
 */
export async function executeCommand(
  command: string,
  options: CommandOptions = {},
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    // 環境変数を設定
    const env = {
      ...process.env,
      ...options.env,
    };

    // bashプロセスを起動
    const bash = spawn('bash', [], {
      cwd: options.cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | null = null;

    // 標準出力の収集
    bash.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // 標準エラー出力の収集
    bash.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // タイムアウト処理
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        bash.kill();
        reject(new Error(`Command timed out after ${options.timeout}ms`));
      }, options.timeout);
    }

    // プロセス終了時の処理
    bash.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      console.error('bash process exited with code', code);
      resolve({
        stdout,
        stderr,
        exitCode: code !== null ? code : 1,
      });
    });

    bash.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);

      console.error('Failed to start bash process:', error);
      reject(error);
    });

    // コマンドを標準入力に書き込み、EOF を送信
    bash.stdin.write(command + '\n');
    bash.stdin.end();
  });
}
