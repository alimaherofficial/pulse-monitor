export interface HttpCheckConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  expectedStatusCodes?: number[];
  expectedKeyword?: string;
  timeoutMs?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
}

export interface HttpCheckResult {
  status: 'up' | 'down' | 'unknown';
  responseTime: number; // in milliseconds
  httpStatusCode?: number;
  errorMessage?: string;
  matchedKeyword?: boolean;
  timestamp: Date;
}

export interface CheckResultData {
  monitorId: string;
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
  httpStatusCode?: number;
  errorMessage?: string;
}
