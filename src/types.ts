export interface OpineConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Deal {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  amount?: number;
  stage?: string;
  probability?: number;
  closeDate?: string;
  organizationId: string;
  contactId?: string;
  ownerId?: string;
  summary?: string;
  salesProcessId?: number;
  salesProcessStageId?: number;
}

export interface DealsResponse {
  items: Deal[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface Evaluation {
  id: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string | null;
  mode: 'PLAN' | 'NO_PLAN' | 'DRAFT';
  active: boolean;
  organizationId: number;
  createdByUserId: number | null;
  accessCode: string;
  buyerAccessLevel: 'RESTRICTED' | 'ANYONE_WITH_LINK';
  brandingColorHex: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  buyerNotificationsEnabled: boolean;
  currentStageId: number | null;
  currentProcessPositionRank: string | null;
  allProcessesPositionRank: string | null;
  derivedFromTemplateId: number | null;
  salesProcessId: number | null;
  defaultAssigneeUserId: number | null;
}

export interface EvaluationsResponse {
  items: Evaluation[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface ListDealsParams {
  limit?: number;
  offset?: number;
  includeSummary?: boolean;
  includeDeleted?: boolean;
}

export interface GetDealParams {
  id: string;
  includeSummary?: boolean;
}

export interface ListEvaluationsParams {
  limit?: number;
  offset?: number;
}

export interface SalesProcess {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdByUserId: number;
}

export interface SalesProcessesResponse {
  items: SalesProcess[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface ListSalesProcessesParams {
  limit?: number;
  offset?: number;
}

export interface SalesProcessStage {
  id: number;
  title: string;
  category: string;
  deletedAt?: string;
}

export interface SalesProcessStagesResponse {
  items: SalesProcessStage[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface ListSalesProcessStagesParams {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface LinkedDeal {
  id: number;
  evaluationId: number;
  name: string;
  priority: 'BLOCKER' | 'IMPORTANT' | 'NICE_TO_HAVE';
  sharedWithBuyer: boolean;
}

export interface Ticket {
  type: 'BUG' | 'FEATURE' | 'CUSTOM_1' | 'CUSTOM_2' | 'CUSTOM_3' | 'CUSTOM_4' | 'CUSTOM_5';
  state: 'OPEN' | 'PRIORITIZING' | 'ROADMAP' | 'DEFERRED' | 'IN_PROGRESS' | 'CLOSED';
  id: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  organizationId: number;
  createdByUserId: number;
  title: string;
  description: string;
  vendorEntityId?: string;
  vendorEntityKey?: string;
  integrationInstallationId?: number;
  targetDueDate?: string;
  linkedDeals: LinkedDeal[];
  dealAmountSum: number;
  vendorEntityUrl?: string;
}

export interface TicketsResponse {
  items: Ticket[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface ListTicketsParams {
  limit?: number;
  offset?: number;
}

export interface DealAssociation {
  id: number;
  priority: 'BLOCKER' | 'IMPORTANT' | 'NICE_TO_HAVE';
  delete?: boolean;
}

export interface UpdateTicketParams {
  id: string;
  title?: string;
  type?: 'BUG' | 'FEATURE' | 'CUSTOM_1' | 'CUSTOM_2' | 'CUSTOM_3' | 'CUSTOM_4' | 'CUSTOM_5';
  state?: 'OPEN' | 'PRIORITIZING' | 'ROADMAP' | 'DEFERRED' | 'IN_PROGRESS' | 'CLOSED';
  description?: any; // Slate node array, markdown string, or null
  targetDueDate?: string | null;
  deals?: DealAssociation[];
  labels?: string[] | null;
  vendorEntityUrl?: string | null;
}

export interface Note {
  id: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: any; // Slate nodes array or markdown string
}

export interface CreateDealNoteParams {
  dealId: string;
  title: string;
  body?: any;
}

export interface CreateTicketParams {
  title: string;
  type: 'BUG' | 'FEATURE' | 'CUSTOM_1' | 'CUSTOM_2' | 'CUSTOM_3' | 'CUSTOM_4' | 'CUSTOM_5';
  state: 'OPEN' | 'PRIORITIZING' | 'ROADMAP' | 'DEFERRED' | 'IN_PROGRESS' | 'CLOSED';
  description?: any;
  targetDueDate?: string;
  deals?: Array<{
    id: number | string;
    priority: 'BLOCKER' | 'IMPORTANT' | 'NICE_TO_HAVE';
  }>;
  labels?: string[];
  vendorEntityUrl?: string;
}
