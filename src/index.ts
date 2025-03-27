import { startServer } from './server';

async function main() {
  try {
    await startServer();
    console.error('Shell Command MCP Server started');
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

main();
