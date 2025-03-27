.PHONY: build start stop dev clean install-deps lint format test

# Docker composition
build:
	docker-compose build

start:
	docker-compose up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec mcp-server bash

# Development commands (local)
dev:
	npm run dev

clean:
	npm run clean

install-deps:
	npm ci

lint:
	npm run lint

format:
	npm run format

# Build and package
package: clean build
	docker save -o shell-command-mcp.tar shell-command-mcp_mcp-server
