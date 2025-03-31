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

### execute-bash-script-sync

Execute any bash script synchronously within the container.

Each command execution spawn a new bash process.

Use execute-bash-script-async tool mainly instead of this to save execution time except waiting task.

```
Arguments:
- command: The bash script to execute
- workingDir: (optional) The working directory to execute the script
- env: (optional) The environment variables for the script
- timeout: (optional) Timeout in milliseconds
```

### execute-bash-script-async

Execute any bash script asynchronously within the container.

Each command execution spawn a new bash process.

```
Arguments:
- command: The bash script to execute
- workingDir: (optional) The working directory to execute the script
- env: (optional) The environment variables for the script
- timeout: (optional) Timeout in milliseconds
- outputMode: (optional) The output mode for the script. default is complete
  - complete: Notify when the command is completed
  - line: Notify on each line of output
  - chunk: Notify on each chunk of output
  - character: Notify on each character of output
```

## Security Considerations

- The MCP server runs as a non-root user within the container
- The container does not have access to the host Docker daemon
- User workspace is mounted from the host for persistence

## License

MIT
