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
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description?: string;
  active: boolean;
  organizationId: string;
  accessCode?: string;
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
  priority: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  sharedWithBuyer: boolean;
}

export interface Ticket {
  type: 'BUG' | 'FEATURE_REQUEST' | 'QUESTION' | 'OTHER';
  state: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
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
