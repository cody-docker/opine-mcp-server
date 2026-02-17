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
  ListSalesProcessStagesParams,
  UpdateTicketParams,
  CreateDealNoteParams,
  CreateTicketParams
} from './types.js';
import { ensureId18 } from './salesforce-utils.js';

class OpineMCPServer {
  private server: Server;
  private opineClient: OpineClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'opine-mcp-server',
        version: '2.1.0'
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
        },
        {
          name: 'update_ticket',
          description: 'Update an existing ticket in Opine. Requires tickets:write scope.',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Ticket ID to update',
                pattern: '^.+$'
              },
              title: {
                type: 'string',
                description: 'Ticket title (1-256 characters)',
                minLength: 1,
                maxLength: 256
              },
              type: {
                type: 'string',
                description: 'Ticket type',
                enum: ['BUG', 'FEATURE', 'CUSTOM_1', 'CUSTOM_2', 'CUSTOM_3', 'CUSTOM_4', 'CUSTOM_5']
              },
              state: {
                type: 'string',
                description: 'Ticket state',
                enum: ['OPEN', 'PRIORITIZING', 'ROADMAP', 'DEFERRED', 'IN_PROGRESS', 'CLOSED']
              },
              description: {
                description: 'Ticket description (Slate node array, markdown string, or null to clear)'
              },
              targetDueDate: {
                type: 'string',
                description: 'Target due date in ISO 8601 format (nullable)',
                format: 'date-time'
              },
              deals: {
                type: 'array',
                description: 'Array of deal associations',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                      description: 'Deal ID'
                    },
                    priority: {
                      type: 'string',
                      description: 'Deal priority',
                      enum: ['BLOCKER', 'IMPORTANT', 'NICE_TO_HAVE']
                    },
                    delete: {
                      type: 'boolean',
                      description: 'Set to true to remove this deal association'
                    }
                  },
                  required: ['id', 'priority']
                }
              },
              labels: {
                type: 'array',
                description: 'Array of case-sensitive label strings (replaces all existing labels, or clears if null/empty)',
                items: {
                  type: 'string'
                }
              },
              vendorEntityUrl: {
                type: 'string',
                description: 'Vendor entity URL in URI format (nullable)',
                format: 'uri'
              }
            },
            required: ['id']
          }
        },
        {
          name: 'create_deal_note',
          description: 'Add a note to a specific deal. Requires deals:write scope.',
          inputSchema: {
            type: 'object',
            properties: {
              dealId: {
                type: 'string',
                description: 'Deal ID (Opine ID or external service ID)',
                pattern: '^.+$'
              },
              title: {
                type: 'string',
                description: 'Note title',
                maxLength: 512
              },
              body: {
                description: 'Note body (Slate nodes array or markdown string, optional)'
              }
            },
            required: ['dealId', 'title']
          }
        },
        {
          name: 'create_ticket',
          description: 'Create a new ticket in Opine. Requires tickets:write scope.',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Ticket title (1-256 characters)',
                minLength: 1,
                maxLength: 256
              },
              type: {
                type: 'string',
                description: 'Ticket type',
                enum: ['BUG', 'FEATURE', 'CUSTOM_1', 'CUSTOM_2', 'CUSTOM_3', 'CUSTOM_4', 'CUSTOM_5']
              },
              state: {
                type: 'string',
                description: 'Ticket state',
                enum: ['OPEN', 'PRIORITIZING', 'ROADMAP', 'DEFERRED', 'IN_PROGRESS', 'CLOSED']
              },
              description: {
                description: 'Ticket description (Slate node array or markdown string, optional)'
              },
              targetDueDate: {
                type: 'string',
                description: 'Target due date in ISO 8601 format',
                format: 'date-time'
              },
              deals: {
                type: 'array',
                description: 'Array of deal associations',
                items: {
                  type: 'object',
                  properties: {
                    id: { description: 'Deal ID (numeric or vendor entity ID string)' },
                    priority: {
                      type: 'string',
                      enum: ['BLOCKER', 'IMPORTANT', 'NICE_TO_HAVE']
                    }
                  },
                  required: ['id', 'priority']
                }
              },
              labels: {
                type: 'array',
                description: 'Array of label strings',
                items: { type: 'string' }
              },
              vendorEntityUrl: {
                type: 'string',
                description: 'Vendor entity URL',
                format: 'uri'
              }
            },
            required: ['title', 'type', 'state']
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

          case 'update_ticket': {
            if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
              throw new Error('Ticket ID is required');
            }
            const params = args as unknown as UpdateTicketParams;
            const result = await this.opineClient.updateTicket(params);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'create_deal_note': {
            if (!args || typeof args !== 'object' || !('dealId' in args) || typeof args.dealId !== 'string') {
              throw new Error('Deal ID is required');
            }
            if (!('title' in args) || typeof args.title !== 'string') {
              throw new Error('Note title is required');
            }
            const params = args as unknown as CreateDealNoteParams;
            const result = await this.opineClient.createDealNote(params);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'create_ticket': {
            if (!args || typeof args !== 'object') {
              throw new Error('Invalid parameters for create_ticket');
            }
            if (!('title' in args) || typeof args.title !== 'string') {
              throw new Error('Ticket title is required');
            }
            if (!('type' in args) || typeof args.type !== 'string') {
              throw new Error('Ticket type is required');
            }
            if (!('state' in args) || typeof args.state !== 'string') {
              throw new Error('Ticket state is required');
            }
            const params = args as unknown as CreateTicketParams;
            const result = await this.opineClient.createTicket(params);

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