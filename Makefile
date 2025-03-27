.PHONY: build

# Docker composition
build:
	docker build -t shell-command-mcp .

run:
	docker run --rm -i --mount type=bind,src=/home/kaznak/ClaudeWorks,dst=/home/mcp/Works -e WORKDIR=/home/mcp/Works shell-command-mcp
