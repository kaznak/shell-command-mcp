# Shell Command MCP Server

This is an MCP (Model Context Protocol) server that allows executing shell commands within a Docker container. It provides a secure and isolated environment for running commands without giving access to the host Docker daemon.

## Features

- Run shell commands through a simple MCP interface
- Kubernetes tools included: kubectl, helm, kustomize, k9s
- Isolated Docker container environment with non-root user
- Built with TypeScript and the MCP SDK

## Getting Started

### Prerequisites

- Docker

### Usage with Claude for Desktop

Add the following configuration to your Claude for Desktop configuration file.

MacOS:

```json
"shell-command": {
  "command": "docker",
  "args": [
    "run",
    "--rm",
    "-i",
    "--mount",
    "type=bind,src=/Users/user-name/ClaudeWorks,dst=/home/mcp/ClaudeWorks",
    "ghcr.io/kaznak/shell-command-mcp:v1.0.0"
  ]
}
```

Replace `/Users/user-name/ClaudeWorks` with the directory you want to make available to the container.

Windows:

```json
"shell-command": {
   "command": "docker",
   "args": [
      "run",
      "--rm",
      "-i",
      "--mount",
      "type=bind,src=\\\\wsl.localhost\\Ubuntu\\home\\user-name\\ClaudeWorks,dst=/home/mcp/Works",
      "ghcr.io/kaznak/shell-command-mcp:v1.0.0"
   ]
}
```

### Feed some prompts

To Operate the files in the mounted directory.

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
