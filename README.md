# Shell Command MCP Server

This is an MCP (Model Context Protocol) server that allows executing shell commands within a Docker container. It provides a secure and isolated environment for running commands without giving access to the host Docker daemon.

## Features

- Run shell commands through a simple MCP interface
- Kubernetes tools included: kubectl, helm, kustomize, k9s
- Isolated Docker container environment with non-root user
- Built with TypeScript and the MCP SDK

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x and npm (for local development)

### Installation

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/shell-command-mcp.git
   cd shell-command-mcp
   ```

2. Build the Docker image:

   ```
   make build
   ```

3. Start the MCP server:
   ```
   make start
   ```

### Local Development

1. Install dependencies:

   ```
   npm ci
   ```

2. Start the development server:

   ```
   npm run dev
   ```

3. Lint and format code:
   ```
   npm run lint
   npm run format
   ```

## Usage with Claude for Desktop

Add the following configuration to your Claude for Desktop configuration file:

```json
{
  "mcpServers": {
    "shell-command": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "/path/to/home/dir:/home/mcp",
        "ghcr.io/kaznak/shell-command-mcp:latest"
      ]
    }
  }
}
```

Replace `/path/to/home/dir` with the directory you want to make available to the container.

## Available MCP Tools

### execute-command

Execute any shell command within the container.

```
Arguments:
- command: The shell command to execute
- workingDir: (optional) Working directory for command execution
- env: (optional) Environment variables for the command
- timeout: (optional) Timeout in milliseconds
```

## Security Considerations

- The MCP server runs as a non-root user within the container
- The container does not have access to the host Docker daemon
- User workspace is mounted from the host for persistence

## License

MIT
