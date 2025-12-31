export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  MATH = 'MATH',
  REPORT = 'REPORT',
  CYBER = 'CYBER'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  avatar: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  type: 'text' | 'image' | 'code';
  timestamp: number;
  sources?: Source[];
}

export interface ChartData {
  name: string;
  value: number;
  category?: string;
}

export interface ReportData {
  title: string;
  summary: string;
  data: ChartData[];
  insight: string;
}

export interface ThreatIntel {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  source: string;
  timestamp: string;
}

export interface SandboxResult {
  verdict: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
  riskScore: number;
  detectedBehaviors: string[];
  isolationAction: string;
  technicalAnalysis: string;
}

export interface OmniConfig {
  temperature: number;
  creativity: number;
  systemPrompt: string;
}

export interface AlertConfig {
  cpuWarning: number;
  cpuCritical: number;
  memWarning: number;
  memCritical: number;
  netCritical: number; // MB/s threshold
  diskCritical: number; // IOPS/MBs threshold
  autoIsolation: boolean;
}

export interface Countermeasure {
  id: string;
  type: 'NETWORK' | 'PROCESS' | 'FILE';
  action: string;
  target: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}