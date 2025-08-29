# Opine MCP Server

A Model Context Protocol (MCP) server for querying deals and evaluations from the Opine CRM API.

## Features

- **List Deals**: Query deals with filtering options
- **Get Deal**: Retrieve specific deal details by ID
- **List Evaluations**: Query evaluations with pagination

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
- View available tools (`list_deals`, `get_deal`, `list_evaluations`)
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

#### `get_deal`
Get a specific deal by ID:
- `id` (required): Deal ID (Opine ID or external service ID)
- `includeSummary` (optional): Include AI-generated deal summary

#### `list_evaluations`
List evaluations with optional parameters:
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Number of results to skip (default: 0)

## API Requirements

This server requires:
- A valid Opine API key
- The following API scopes:
  - `deals:read` for deal operations
  - `evaluations:read` for evaluation operations

## Error Handling

The server handles API errors and provides meaningful error messages. Common issues:
- Missing or invalid API key
- Insufficient API scopes
- Network connectivity issues
- Invalid request parameters