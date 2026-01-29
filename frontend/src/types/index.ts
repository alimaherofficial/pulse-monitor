export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  githubId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Monitor {
  id: string;
  name: string;
  type: 'HTTP' | 'CRON' | 'SSL';
  url: string | null;
  interval: number;
  gracePeriod: number | null;
  expectedStatusCode: number | null;
  keyword: string | null;
  status: 'UP' | 'DOWN' | 'PENDING' | 'PAUSED';
  isActive: boolean;
  lastCheckedAt: string | null;
  lastStatusChangeAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count?: {
    checks: number;
    incidents: number;
  };
}

export interface CheckResult {
  id: string;
  status: 'UP' | 'DOWN';
  responseTime: number | null;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
  monitorId: string;
}

export interface Incident {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
  reason: string | null;
  monitorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  password: string | null;
  logoUrl: string | null;
  customCss: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  monitors: Monitor[];
}

export interface AlertChannel {
  id: string;
  type: 'EMAIL' | 'TELEGRAM' | 'DISCORD' | 'WEBHOOK';
  target: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  totalIncidents: number;
  activeIncidents: number;
}
