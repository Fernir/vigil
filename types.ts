// Types for tables
export interface UserInterface {
  id: number;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  webhook_url?: string;
  max_sites: number;
  banned_at: Date | null;
  is_admin?: boolean;
}

export interface SiteInterface {
  id: number;
  name: string;
  url: string;
  checkInterval: number;
  isActive?: boolean;
  userId?: number | null;
  check_type?: string;
  expected_text?: string | number | undefined;
  text_condition?: string;
  created_at: string;
  updated_at: string;
  lastCheck?: {
    status: "up" | "down" | "degraded";
    responseTime: number;
    statusCode?: number;
    errorMessage?: string;
    checked_at: string;
  };
}

export interface CheckResultInterface {
  id: number;
  siteId: number;
  status: "up" | "down" | "degraded" | "pending";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checked_at: string;
}

export interface SpeedResultInterface {
  id?: number;
  siteId?: number;
  loadTime: number;
  ttfb?: number;
  domContentLoaded?: number;
  pageSize?: number;
  requestCount?: number;
  error?: string | null;
  checked_at?: string;
  type?: "speed";
  siteName?: string;
  siteUrl?: string;
}

export interface SSLResultInterface {
  id: number;
  siteId: number;
  valid: boolean;
  expired: boolean;
  daysLeft: number;
  validFrom: string;
  validTo: string;
  issuer: string | null;
  error: string | null;
  checked_at: string;
  type?: "ssl";
  siteName?: string;
  siteUrl?: string;
}

export interface ScreenshotResultInterface {
  id: number;
  siteId: number;
  width: number;
  height: number;
  checked_at: string;
  type?: "screenshot";
  siteName?: string;
  siteUrl?: string;
  image_base64?: string;
}

export interface AnomalyPoint {
  timestamp: string;
  responseTime: number;
  isAnomaly: boolean;
  zScore: number;
}

export interface AnomalyResult {
  anomalies: AnomalyPoint[];
  anomalyCount: number;
  averageResponseTime: number;
  prediction: {
    nextHourRisk: number;
    trend: "improving" | "stable" | "degrading";
  };
}
