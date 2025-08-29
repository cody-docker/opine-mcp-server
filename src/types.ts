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