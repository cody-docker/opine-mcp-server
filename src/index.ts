#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { OpineClient } from './opine-client.js';
import {
  ListDealsParams,
  GetDealParams,
  ListEvaluationsParams,
  ListTicketsParams,
  ListSalesProcessesParams,
  ListSalesProcessStagesParams
} from './types.js';
import { ensureId18 } from './salesforce-utils.js';

class OpineMCPServer {
  private server: Server;
  private opineClient: OpineClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'opine-mcp-server',
        version: '1.0.0'
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
          name: 'get_salesforce_deal',
          description: 'Get a specific deal by Salesforce ID (automatically converts 15-char to 18-char and prepends "eid:" prefix)',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Salesforce deal ID (15 or 18 characters, will be converted to 18-char format and prefixed with "eid:")',
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
        },
        {
          name: 'list_tickets',
          description: 'List tickets/requests from Opine',
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
        },
        {
          name: 'list_sales_processes',
          description: 'List sales processes configured in Opine',
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
        },
        {
          name: 'list_sales_process_stages',
          description: 'List sales process stages from Opine',
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
              includeDeleted: {
                type: 'boolean',
                description: 'Include deleted sales process stages'
              }
            }
          }
        },
        {
          name: 'describe_deal_sales_process',
          description: 'Get a deal along with resolved sales process and stage metadata',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Deal ID. If this is a Salesforce ID (15 or 18 characters), set isSalesforceId to true.',
                pattern: '^.+$'
              },
              isSalesforceId: {
                type: 'boolean',
                description: 'Treat the id as a Salesforce ID (15 or 18 chars); it will be normalized and prefixed with "eid:".'
              },
              includeSummary: {
                type: 'boolean',
                description: 'Include AI-generated deal summary when fetching the deal'
              }
            },
            required: ['id']
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

          case 'get_salesforce_deal': {
            if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
              throw new Error('Salesforce deal ID is required');
            }
            // Convert 15-char Salesforce ID to 18-char format if needed
            const salesforceId = args.id;
            const id18 = ensureId18(salesforceId);
            // Prepend 'eid:' to the 18-character Salesforce ID
            const opineId = `eid:${id18}`;
            const params = {
              id: opineId,
              includeSummary: 'includeSummary' in args ? (args as any).includeSummary as boolean : undefined
            } as GetDealParams;
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

          case 'list_tickets': {
            const params = (args || {}) as ListTicketsParams;
            const result = await this.opineClient.listTickets(params);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'list_sales_processes': {
            const params = (args || {}) as ListSalesProcessesParams;
            const result = await this.opineClient.listSalesProcesses(params);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'list_sales_process_stages': {
            const params = (args || {}) as ListSalesProcessStagesParams;
            const result = await this.opineClient.listSalesProcessStages(params);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'describe_deal_sales_process': {
            if (!args || typeof args !== 'object' || !('id' in args) || typeof (args as any).id !== 'string') {
              throw new Error('Deal ID is required');
            }

            const idArg = (args as any).id as string;
            const isSalesforceId = 'isSalesforceId' in (args as any) ? Boolean((args as any).isSalesforceId) : false;
            const includeSummary = 'includeSummary' in (args as any) ? Boolean((args as any).includeSummary) : false;

            let dealId = idArg;
            if (isSalesforceId) {
              const id18 = ensureId18(idArg);
              dealId = `eid:${id18}`;
            }

            const deal = await this.opineClient.getDeal({ id: dealId, includeSummary });

            let salesProcess: any = null;
            let salesProcessStage: any = null;

            if (deal.salesProcessId !== undefined && deal.salesProcessId !== null) {
              const processes = await this.opineClient.listSalesProcesses({ limit: 1000 });
              salesProcess = processes.items.find(p => p.id === deal.salesProcessId) ?? null;
            }

            if (deal.salesProcessStageId !== undefined && deal.salesProcessStageId !== null) {
              const stages = await this.opineClient.listSalesProcessStages({ limit: 1000 });
              salesProcessStage = stages.items.find(s => s.id === deal.salesProcessStageId) ?? null;
            }

            const enriched = {
              deal,
              salesProcess,
              salesProcessStage
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(enriched, null, 2)
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