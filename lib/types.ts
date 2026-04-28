export type ConnectionStatus = 'live' | 'reconnecting' | 'disconnected';
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type NodeType = 'client' | 'service' | 'database';
export type DbFlavor = 'redis' | 'postgres' | 'mongo' | 'mysql' | 'generic';

export interface HealthInfo {
  status: ServiceStatus;
  errorRate: number;
}

export interface ActivityEvent {
  id: string;
  traceId: string;
  source: string;
  target: string;
  rpcMethod: string;
  status: 'ok' | 'error';
  duration: number;
  ts: number;
}

export interface TraceGroup {
  traceId: string;
  spans: ActivityEvent[];
  firstTs: number;          // earliest span.ts — for sort order
  lastStatus: 'ok' | 'error';
}

export interface TravelingDot {
  dotId: string;
  direction: 'forward' | 'backward';
  status: 'ok' | 'error';
  duration: number;         // ms
}

// React Flow requires data to extend Record<string, unknown>
export interface NodeData extends Record<string, unknown> {
  label: string;
  health: HealthInfo;
  nodeType: NodeType;
  dbFlavor?: DbFlavor;      // set only when nodeType === 'database'
}

export interface EdgeData extends Record<string, unknown> {
  travelingDots: TravelingDot[];
}
