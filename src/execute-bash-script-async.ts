import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { spawn } from 'child_process';

export const toolName = 'execute-bash-script-async';

export const toolDescription = `This tool executes shell script on bash asynchronously.
Each command execution spawn a new bash process.
`;

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  outputMode?: 'complete' | 'line' | 'character' | 'chunk';
  onOutput?: (data: string, isStderr: boolean) => void;
}

export const toolOptionsSchema = {
  command: z.string().describe('The bash script to execute'),
  options: z.object({
    cwd: z.string().optional().describe(`The working directory to execute the script.
use this option argument to avoid cd command in the first line of the script.
`),
    env: z.record(z.string(), z.string()).optional().describe('The environment variables to set'),
    timeout: z.number().int().positive().optional().describe('The timeout in milliseconds'),
    outputMode: z.enum(['complete', 'line', 'character', 'chunk']).optional().default('complete')
      .describe(`The output mode for the script.
- complete: Notify when the command is completed
- line: Notify on each line of output
- chunk: Notify on each chunk of output
- character: Notify on each character of output
`),
  }),
};

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * シェルスクリプト出力ハンドリング関数
 */
function handleOutput(
  chunk: string,
  isStderr: boolean,
  outputMode: CommandOptions['outputMode'],
  onOutput: CommandOptions['onOutput'] | undefined,
  buffer: { current: string }, // バッファのコピーを回避
) {
  if (onOutput) {
    if (outputMode === 'character') {
      // 文字ごとに通知
      for (const char of chunk) {
        onOutput(char, isStderr);
      }
    } else if (outputMode === 'line') {
      // 行ごとに通知
      buffer.current += chunk;
      const lines = buffer.current.split('\n');
      buffer.current = lines.pop() || '';

      for (const line of lines) {
        onOutput(line, isStderr);
      }
    } else if (outputMode === 'chunk') {
      // チャンク（データ受信単位）ごとに通知
      onOutput(chunk, isStderr);
    }
    // complete モードでは通知なし
  }
}

/**
 * 柔軟な出力モードをサポートするコマンド実行関数
 */
export async function executeCommand(
  command: string,
  options: CommandOptions = {},
): Promise<CommandResult> {
  const outputMode = (options as CommandOptions).outputMode || 'complete';
  const onOutput = options.onOutput;

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
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let timeoutId: NodeJS.Timeout | null = null;

    // 標準出力の処理
    bash.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;

      handleOutput(chunk, false, outputMode, onOutput, { current: stdoutBuffer });
    });

    // 標準エラー出力の処理
    bash.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;

      handleOutput(chunk, true, outputMode, onOutput, { current: stderrBuffer });
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

      // バッファの残りを処理（全てのモードで実行）
      if (onOutput) {
        if (stdoutBuffer) {
          onOutput(stdoutBuffer, false);
        }
        if (stderrBuffer) {
          onOutput(stderrBuffer, true);
        }
      }

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

// MCPサーバーにコマンド実行ツールを追加する関数
export function setTool(mcpServer: McpServer) {
  // McpServerインスタンスから低レベルのServerインスタンスにアクセスする
  const server: Server = mcpServer.server;

  // 単一のツールとして登録
  mcpServer.tool(
    toolName,
    toolDescription,
    toolOptionsSchema,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ command, options = {} }, extra) => {
      try {
        // outputModeを取得、デフォルト値は'complete'
        const outputMode = options?.outputMode || 'complete';
        // 進捗トークンを生成
        const progressToken = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // バッファリングとバッチ処理のための変数
        let outputBuffer = '';
        let updateTimer: NodeJS.Timeout | null = null;
        const updateInterval = 100; // ミリ秒単位での更新間隔

        // バッファ内容を送信する関数
        const flushBuffer = () => {
          if (outputBuffer) {
            server.notification({
              method: 'notifications/tools/progress',
              params: {
                progressToken,
                result: {
                  content: [
                    {
                      type: 'text' as const,
                      text: outputBuffer,
                    },
                  ],
                  isComplete: false,
                },
              },
            });
            outputBuffer = '';
          }
        };

        // すべてのモードで非同期処理を行う
        // completeモードでは全ての出力が集まってから結果を返す
        if (outputMode === 'complete') {
          // バックグラウンドでコマンドを実行
          executeCommand(command, {
            ...options,
          })
            .then(({ stdout, stderr, exitCode }) => {
              // 完了通知を送信
              server.notification({
                method: 'notifications/tools/progress',
                params: {
                  progressToken,
                  result: {
                    content: [
                      {
                        type: 'text' as const,
                        text: `stdout: ${stdout}`,
                      },
                      {
                        type: 'text' as const,
                        text: `stderr: ${stderr}`,
                      },
                      {
                        type: 'text' as const,
                        text: `exitCode: ${exitCode}`,
                      },
                    ],
                    isComplete: true,
                  },
                },
              });
            })
            .catch((error) => {
              // 残りのバッファをフラッシュ
              if (updateTimer) {
                clearTimeout(updateTimer);
                flushBuffer();
              }

              // エラー通知を送信
              server.notification({
                method: 'notifications/tools/progress',
                params: {
                  progressToken,
                  result: {
                    content: [
                      {
                        type: 'text' as const,
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                      },
                    ],
                    isComplete: true,
                    isError: true,
                  },
                },
              });
            });
        } else {
          // バックグラウンドでコマンドを実行
          executeCommand(command, {
            ...options,
            onOutput: (data, isStderr) => {
              // 出力形式を整形
              const formattedOutput = `${isStderr ? '[stderr] ' : ''}${data}${outputMode === 'line' ? '\n' : ''}`;

              // 文字モードとchunkモードではバッファリング、行モードでは即時送信
              if (outputMode === 'character' || outputMode === 'chunk') {
                outputBuffer += formattedOutput;

                if (!updateTimer) {
                  updateTimer = setTimeout(() => {
                    flushBuffer();
                    updateTimer = null;
                  }, updateInterval);
                }
              } else {
                // 行モードでは各行を個別に送信
                server.notification({
                  method: 'notifications/tools/progress',
                  params: {
                    progressToken,
                    result: {
                      content: [
                        {
                          type: 'text' as const,
                          text: formattedOutput,
                        },
                      ],
                      isComplete: false,
                    },
                  },
                });
              }
            },
          })
            .then(({ stdout, stderr, exitCode }) => {
              // 完了通知を送信
              server.notification({
                method: 'notifications/tools/progress',
                params: {
                  progressToken,
                  result: {
                    content: [
                      {
                        type: 'text' as const,
                        text: `stdout: ${stdout}`,
                      },
                      {
                        type: 'text' as const,
                        text: `stderr: ${stderr}`,
                      },
                      {
                        type: 'text' as const,
                        text: `exitCode: ${exitCode}`,
                      },
                    ],
                    isComplete: true,
                  },
                },
              });
            })
            .catch((error) => {
              // 残りのバッファをフラッシュ
              if (updateTimer) {
                clearTimeout(updateTimer);
                flushBuffer();
              }

              // エラー通知を送信
              server.notification({
                method: 'notifications/tools/progress',
                params: {
                  progressToken,
                  result: {
                    content: [
                      {
                        type: 'text' as const,
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                      },
                    ],
                    isComplete: true,
                    isError: true,
                  },
                },
              });
            });
        }

        // 初期レスポンスを返す
        return {
          content: [
            {
              type: 'text' as const,
              text: `# Command execution started with output mode, ${outputMode}`,
            },
          ],
          progressToken,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
