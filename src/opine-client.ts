import fetch from 'node-fetch';
import {
  OpineConfig,
  Deal,
  DealsResponse,
  Evaluation,
  EvaluationsResponse,
  ListDealsParams,
  GetDealParams,
  ListEvaluationsParams
} from './types.js';

export class OpineClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OpineConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.tryopine.com/v1';
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Opine API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async listDeals(params: ListDealsParams = {}): Promise<DealsResponse> {
    return this.makeRequest<DealsResponse>('/deals', params);
  }

  async getDeal(params: GetDealParams): Promise<Deal> {
    const { id, ...queryParams } = params;
    return this.makeRequest<Deal>(`/deals/${encodeURIComponent(id)}`, queryParams);
  }

  async listEvaluations(params: ListEvaluationsParams = {}): Promise<EvaluationsResponse> {
    return this.makeRequest<EvaluationsResponse>('/evaluations', params);
  }
}