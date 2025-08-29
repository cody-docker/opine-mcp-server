#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { OpineClient } from './opine-client.js';
import { ListDealsParams, GetDealParams, ListEvaluationsParams } from './types.js';

class OpineMCPServer {
  private server: Server;
  private opineClient: OpineClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'opine-mcp-server',
        version: '1.0.0',
        description: 'MCP server for querying Opine deals and evaluations'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'list_deals',
          description: 'List deals from Opine CRM',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of results to return (1-1000, default: 100)',
                minimum: 1,
                maximum: 1000
              },
              offset: {
                type: 'number',
                description: 'Number of results to skip (default: 0)',
                minimum: 0
              },
              includeSummary: {
                type: 'boolean',
                description: 'Include AI-generated deal summary'
              },
              includeDeleted: {
                type: 'boolean',
                description: 'Include deleted deals'
              }
            }
          }
        },
        {
          name: 'get_deal',
          description: 'Get a specific deal by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Deal ID (Opine ID or external service ID)',
                pattern: '^.+$'
              },
              includeSummary: {
                type: 'boolean',
                description: 'Include AI-generated deal summary'
              }
            },
            required: ['id']
          }
        },
        {
          name: 'list_evaluations',
          description: 'List evaluations from Opine',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of results to return (1-1000, default: 100)',
                minimum: 1,
                maximum: 1000
              },
              offset: {
                type: 'number',
                description: 'Number of results to skip (default: 0)',
                minimum: 0
              }
            }
          }
        }
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.opineClient) {
        throw new Error('Opine client not initialized. Please set OPINE_API_KEY environment variable.');
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_deals': {
            const params = (args || {}) as ListDealsParams;
            const result = await this.opineClient.listDeals(params);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'get_deal': {
            if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
              throw new Error('Deal ID is required');
            }
            const params = args as unknown as GetDealParams;
            const result = await this.opineClient.getDeal(params);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'list_evaluations': {
            const params = (args || {}) as ListEvaluationsParams;
            const result = await this.opineClient.listEvaluations(params);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new Error(`Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  async run() {
    const apiKey = process.env.OPINE_API_KEY;
    if (!apiKey) {
      console.error('Error: OPINE_API_KEY environment variable is required');
      process.exit(1);
    }

    this.opineClient = new OpineClient({ apiKey });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Opine MCP server running on stdio');
  }
}

const server = new OpineMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});