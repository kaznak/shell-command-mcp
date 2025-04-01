# Shell Command MCP Server

This is an MCP (Model Context Protocol) server that allows executing shell commands within a Docker container. It provides a secure and isolated workspace for running commands without giving access to the host Docker daemon.

## Features

- Run shell scripts through a simple MCP interface
  - synchronous execution
  - asynchronous execution with 4 different modes
    - complete: notify when the command is completed
    - line: notify on each line of output
    - chunk: notify on each chunk of output
    - character: notify on each character of output
- Kubernetes tools included: kubectl, helm, kustomize, hemfile
- Isolated Docker container environment with non-root user
  - host-container userid/groupid mapping implemented. this allows the container to run as the same user as the host, ensuring that files created by the container have the same ownership and permissions as those created by the host.
  - mount a host directory to the container /home/mcp directory for persistence. it become the home directory the AI works in.
  - if the host directory is empty, the initial files will be copied form the backup in the container.

## Design Philosophy

This MCP server provides AI with a workspace similar to that of a human.
Authorization is limited not by MCP functions, but by container isolation and external authorization restrictions.

It provides more general tools such as shell script execution, so that they can be used without specialized knowledge of tool use.

The server implementation is kept as simple as possible to facilitate code auditing.

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
    "type=bind,src=/Users/user-name/MCPHome,dst=/home/mcp",
    "ghcr.io/kaznak/shell-command-mcp:latest"
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
      "type=bind,src=\\\\wsl.localhost\\Ubuntu\\home\\user-name\\MCPHome,dst=/home/mcp",
      "ghcr.io/kaznak/shell-command-mcp:latest"
   ]
}
```

### Feed some prompts

To Operate the files in the mounted directory.

## Available MCP Tools

- [execute-bash-script-sync](./src/execute-bash-script-sync.ts)
- [execute-bash-script-async](./src/execute-bash-script-async.ts)

## Security Considerations

- The MCP server runs as a non-root user within the container
- The container does not have access to the host Docker daemon
- User workspace is mounted from the host for persistence

## License

MIT
