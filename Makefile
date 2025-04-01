.PHONY: build

# Docker composition
build:
	docker build -t shell-command-mcp .

run:
	docker run --rm -i --mount type=bind,src="$HOME/MCPHome",dst=/home/mcp shell-command-mcp
