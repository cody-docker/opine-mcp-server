# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

- Install dependencies:
  - `npm install`
- Build the TypeScript project (outputs to `build/` using `tsconfig.json`):
  - `npm run build`
- Run the MCP server in development mode (TypeScript via `tsx`):
  - `npm run dev`
- Run the built MCP server (Node.js on compiled JavaScript):
  - `npm start`
- Run the MCP Inspector directly against the built server:
  - `npm run inspector`
- Run the MCP Inspector using `mcp-config.json` (reads `OPINE_API_KEY` from that file):
  - Update `mcp-config.json` with a non-empty API key
  - `npm run inspector:config`
- Required environment variable for all runtime modes (except when set in `mcp-config.json`):
  - `OPINE_API_KEY` — Opine API key used by the server and client
- Docker flows:
  - Build hardened multi-stage image: `npm run docker:build`
  - Run hardened image (uses `OPINE_API_KEY` from your environment): `npm run docker:run`

### Ad‑hoc testing

There is no formal test runner configured (no `npm test` script). A console-based harness exists for the Salesforce ID utilities:

- Run the Salesforce ID conversion tests (single test script):
  - `npx tsx src/salesforce-utils.test.ts`

## Project architecture

### Overview

This repository implements a Model Context Protocol (MCP) server that exposes Opine CRM data (deals, evaluations, tickets) as MCP tools over stdio. The core logic is written in TypeScript under `src/` and compiled to ESM JavaScript in `build/` via `tsconfig.json` and the `npm run build` script. Runtime entrypoints are shared between local CLI use, MCP Inspector, and Docker.

### MCP server entrypoint (`src/index.ts`)

- Defines the `OpineMCPServer` class, which owns:
  - An MCP `Server` instance from `@modelcontextprotocol/sdk` configured with basic metadata (name/version) and `tools` capabilities.
  - A lazily-initialized `OpineClient` instance that is created in `run()` after reading `process.env.OPINE_API_KEY`.
- Registers request handlers:
  - `ListToolsRequestSchema` — returns a static list of MCP tools exposed by this server:
    - `list_deals`
    - `get_deal`
    - `get_salesforce_deal`
    - `list_evaluations`
    - `list_tickets`
  - `CallToolRequestSchema` — dispatches tool calls via a `switch (name)` and delegates to the appropriate `OpineClient` method.
- Tool behaviors:
  - `list_deals` / `list_evaluations` / `list_tickets`:
    - Accept optional pagination parameters (`limit`, `offset`) plus tool-specific flags (e.g., `includeSummary`, `includeDeleted` for deals).
    - Call the corresponding `OpineClient` list method with a typed params object from `src/types.ts`.
  - `get_deal`:
    - Accepts a generic Opine or external deal ID and optional `includeSummary` flag.
    - Validates arguments at runtime before delegating to `OpineClient.getDeal`.
  - `get_salesforce_deal`:
    - Accepts a Salesforce ID that may be 15 or 18 characters.
    - Uses `ensureId18` from `src/salesforce-utils.ts` to normalize to an 18-character ID.
    - Prefixes the normalized ID with `eid:` (Opine’s convention for external IDs) and then calls `OpineClient.getDeal` with that computed ID.
  - `list_sales_processes` / `list_sales_process_stages`:
    - Provide list-style access to sales process and stage metadata that correspond to the `salesProcessId` and `salesProcessStageId` fields on deals.
  - `describe_deal_sales_process`:
    - Orchestrates `getDeal`, `listSalesProcesses`, and `listSalesProcessStages` to return an enriched object containing the deal plus its resolved sales process and stage.
- All tool responses are returned as a single MCP `text` content item containing pretty-printed JSON (`JSON.stringify(result, null, 2)`).
- `run()` connects the MCP server over stdio using `StdioServerTransport`, exits with a non-zero status if `OPINE_API_KEY` is missing, and logs startup and error messages to stderr.

### Opine API client (`src/opine-client.ts`)

- Encapsulates HTTP access to the Opine REST API using `node-fetch` and typed request/response interfaces from `src/types.ts`.
- Configuration:
  - Accepts `OpineConfig` with `apiKey` (required) and optional `baseUrl`.
  - Defaults `baseUrl` to `https://api.tryopine.com/v1` when not provided.
- Core helper:
  - `makeRequest<T>(endpoint, params?)`:
    - Builds a URL relative to `baseUrl`.
    - Serializes any defined `params` entries into query parameters.
    - Sends a `GET` request with `X-API-Key` and `Content-Type: application/json` headers.
    - Throws an error for non-2xx responses including HTTP status information.
    - Returns the parsed JSON body as `T`.
- Public methods (one-to-one with server tools):
  - `listDeals(params: ListDealsParams = {}): Promise<DealsResponse>` — `GET /deals`.
  - `getDeal(params: GetDealParams): Promise<Deal>` — `GET /deals/:id`, with any extra query parameters (e.g., `includeSummary`).
  - `listEvaluations(params: ListEvaluationsParams = {}): Promise<EvaluationsResponse>` — `GET /evaluations`.
  - `listTickets(params: ListTicketsParams = {}): Promise<TicketsResponse>` — `GET /tickets`.

This separation keeps transport and Opine-specific logic in `OpineClient`, while `src/index.ts` remains focused on MCP protocol wiring and tool definitions.

### Domain types (`src/types.ts`)

- Centralizes TypeScript interfaces for both configuration and Opine domain entities:
  - Configuration: `OpineConfig`.
  - Deals: `Deal`, `DealsResponse`, `ListDealsParams`, `GetDealParams`.
  - Evaluations: `Evaluation`, `EvaluationsResponse`, `ListEvaluationsParams`.
  - Tickets: `Ticket`, `LinkedDeal`, `TicketsResponse`, `ListTicketsParams`.
- The MCP server and `OpineClient` both import from this module to:
  - Share a single source of truth for parameter and payload shapes.
  - Ensure that any new Opine endpoints or tools can be added by first defining types here, then wiring through `OpineClient` and `src/index.ts`.

### Salesforce ID utilities (`src/salesforce-utils.ts` and `src/salesforce-utils.test.ts`)

- `convertTo18CharId(id15: string): string`:
  - Implements the standard Salesforce algorithm for converting 15-character case-sensitive IDs to 18-character case-insensitive IDs by computing a 3-character checksum suffix.
  - Processes the ID in three 5-character chunks, derives bit flags from uppercase letters, and maps flags into an alphabet (`A-Z0-9` subset) to produce the checksum.
- `ensureId18(id: string): string`:
  - Validates that the ID is non-empty.
  - Returns 18-character IDs unchanged.
  - Converts 15-character IDs using `convertTo18CharId`.
  - Throws an error for any other length.
- `src/salesforce-utils.test.ts`:
  - A standalone, console-based test harness (not wired to a test runner) that:
    - Exercises `convertTo18CharId` with several synthetic IDs and validates basic invariants (length, original prefix preserved).
    - Exercises `ensureId18` for both 15- and 18-character inputs.
    - Verifies error handling for invalid lengths.
  - Intended to be run directly with `tsx` (see "Ad‑hoc testing" above).

### Build, configuration, and Docker

- TypeScript build:
  - Controlled by `tsconfig.json` with `rootDir: src`, `outDir: build`, strict type checking, and ESM output (`module: ESNext`).
- MCP Inspector configuration (`mcp-config.json`):
  - Declares a single `opine` MCP server entry:
    - `command`: `node`
    - `args`: `["build/index.js"]`
    - `env`: includes an `OPINE_API_KEY` placeholder that should be filled before use.
  - This file is used by `npm run inspector:config` to launch the inspector against the built server.
- Dockerfile:
  - Uses a multi-stage build with hardened Node images:
    - **Builder stage** (`demonstrationorg/dhi-node:24.7-alpine3.22-dev`): installs dependencies with `npm ci`, compiles TypeScript with `npm run build`, then prunes dev dependencies (`npm prune --production`).
    - **Runtime stage** (`demonstrationorg/dhi-node:24.7-alpine3.22`): copies `build/`, production `node_modules`, and `package*.json`, sets `NODE_ENV=production`, and runs `node build/index.js`.
  - The `npm run docker:build` and `npm run docker:run` scripts in `package.json` are thin wrappers over this Dockerfile for local use.
