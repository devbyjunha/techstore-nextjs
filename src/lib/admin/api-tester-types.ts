export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpointDefinition {
  id: string;
  name: string;
  category: string;
  method: HttpMethod;
  path: string;
  description: string;
  sampleBody?: Record<string, unknown>;
  sampleQuery?: Record<string, string>;
}

export interface ApiProxyRequest {
  url: string;
  method: HttpMethod;
  bearerToken?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ApiProxyResponse {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  data: unknown;
  rawBody?: string;
}
