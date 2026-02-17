# Opine MCP Server

A Model Context Protocol (MCP) server for querying deals, evaluations, and tickets from the Opine CRM API.

## Features

- **List Deals**: Query deals with filtering options
- **Get Deal**: Retrieve specific deal details by ID
- **List Evaluations**: Query evaluations with pagination
- **List Tickets**: Query tickets/requests with pagination
- **Update Ticket**: Update existing tickets with new data

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```

## Configuration

Set your Opine API key as an environment variable:

```bash
export OPINE_API_KEY="your-api-key-here"
```

## Usage

### Running the Server

```bash
npm start
```

For development:
```bash
npm run dev
```

### Docker

#### Building the Docker Image

```bash
# Build the Docker image
npm run docker:build

# Or use docker directly
docker build -t opine-mcp-server .
```

#### Running with Docker

```bash
# Run the container with your API key
npm run docker:run

# Or use docker directly
docker run -e OPINE_API_KEY="your-api-key" -i opine-mcp-server

# Test MCP Server
npx @modelcontextprotocol/inspector -- docker run -e OPINE_API_KEY="your_api_key" -i  --rm opine-mcp-server
```

#### Publishing to DockerHub

To build and publish multi-architecture images (linux/amd64 and linux/arm64) to your own DockerHub account:

1. Set your DockerHub username in an environment variable:

   ```bash
   export DOCKERHUB_USERNAME="your-dockerhub-username"
   ```

2. Make sure you are logged in to DockerHub:

   ```bash
   docker login
   ```

3. Build and push the multi-arch image (tags `latest` and the current `package.json` version) with a single command:

   ```bash
   npm run docker:build:multiarch
   ```

This command uses `DOCKERHUB_USERNAME` as the image prefix (for example, `"$DOCKERHUB_USERNAME"/opine-mcp-server:latest`) and pushes a multi-architecture manifest for both amd64 and arm64.

Optionally, you can override the default tags (`latest` and the current `package.json` version) by setting a comma-separated `TAGS` environment variable, for example:

```bash
export TAGS="latest,1.0.5"
```

#### Using Pre-built Image

A pre-built image is available on DockerHub:

```bash
# Pull and run the pre-built image
docker pull codygreen719/opine-mcp-server:latest
docker run -e OPINE_API_KEY="your-api-key" -i codygreen719/opine-mcp-server:latest
```

### Testing with MCP Inspector

The MCP Inspector provides a web-based interface to test your MCP server. There are two ways to use it:

#### Method 1: Direct Server Testing
```bash
npm run inspector
```
This will build the server and launch the inspector directly against the built server.

#### Method 2: Using Configuration File
```bash
# First, update mcp-config.json with your API key
npm run inspector:config
```

Before using the inspector, make sure to:
1. Set your `OPINE_API_KEY` in the environment or update `mcp-config.json`
2. Build the project with `npm run build`

The inspector will open a web interface where you can:
- View available tools (`list_deals`, `get_deal`, `list_evaluations`, `list_tickets`, `update_ticket`)
- Test tool calls with different parameters
- See real-time responses from the Opine API
- Debug any authentication or API issues

### MCP Tools

The server provides the following tools:

#### `list_deals`
List deals from Opine CRM with optional parameters:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `includeSummary` (optional): Include AI-generated deal summary
- `includeDeleted` (optional): Include deleted deals

Each deal now also includes `salesProcessId` and `salesProcessStageId` fields when available, which can be resolved via the sales process tools below.

#### `get_deal`
Get a specific deal by ID:
- `id` (required): Deal ID (Opine ID or external service ID)
- `includeSummary` (optional): Include AI-generated deal summary

#### `list_evaluations`
List evaluations with optional parameters:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)

#### `list_tickets`
List tickets/requests with optional parameters:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)

#### `update_ticket`
Update an existing ticket in Opine (requires `tickets:write` scope):
- `id` (required): Ticket ID to update
- `title` (optional): Ticket title (1-256 characters)
- `type` (optional): Ticket type - BUG, FEATURE, CUSTOM_1, CUSTOM_2, CUSTOM_3, CUSTOM_4, CUSTOM_5
- `state` (optional): Ticket state - OPEN, PRIORITIZING, ROADMAP, DEFERRED, IN_PROGRESS, CLOSED
- `description` (optional): Ticket description (Slate node array, markdown string, or null to clear)
- `targetDueDate` (optional): Target due date in ISO 8601 format (nullable)
- `deals` (optional): Array of deal associations with `id`, `priority` (BLOCKER/IMPORTANT/NICE_TO_HAVE), and optional `delete` flag
- `labels` (optional): Array of case-sensitive label strings (replaces all existing labels, or clears if null/empty)
- `vendorEntityUrl` (optional): Vendor entity URL in URI format (nullable)

#### `list_sales_processes`
List sales processes configured in Opine:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)

#### `list_sales_process_stages`
List sales process stages from Opine:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `includeDeleted` (optional): Include deleted stages

#### `describe_deal_sales_process`
Get an enriched view of a single deal and its sales process:
- `id` (required): Deal ID. If this is a Salesforce ID (15 or 18 characters), set `isSalesforceId` to true.
- `isSalesforceId` (optional): Treat `id` as a Salesforce ID and normalize + prefix with `eid:`.
- `includeSummary` (optional): Include AI-generated deal summary when fetching the deal

The response includes the raw deal (with `salesProcessId`/`salesProcessStageId`) plus resolved `salesProcess` and `salesProcessStage` metadata where available.

## API Requirements

This server requires:
- A valid Opine API key
- The following API scopes:
  - `deals:read` for deal operations
  - `evaluations:read` for evaluation operations
  - `tickets:read` for listing tickets
  - `tickets:write` for updating tickets

## Docker Security

This project uses hardened Docker images for enhanced security:
- **Build Stage**: `demonstrationorg/dhi-node:24.7-alpine3.22-dev` (hardened with build tools)
- **Runtime Stage**: `demonstrationorg/dhi-node:24.7-alpine3.22` (minimal hardened runtime)

The multi-stage build ensures:
- Minimal attack surface in production
- No build tools or source code in final image
- Hardened base images with security patches
- Non-root user execution

## Error Handling

The server handles API errors and provides meaningful error messages. Common issues:
- Missing or invalid API key
- Insufficient API scopes
- Network connectivity issues
- Invalid request parameters