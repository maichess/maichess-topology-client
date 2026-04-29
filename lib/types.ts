export type ConnectionStatus = 'live' | 'reconnecting' | 'disconnected';
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

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

export interface EdgeAnimation {
  animId: number;
  status: 'ok' | 'error';
}

// React Flow requires data to extend Record<string, unknown>
export interface NodeData extends Record<string, unknown> {
  label: string;
  health: HealthInfo;
}

export interface EdgeData extends Record<string, unknown> {
  animations: EdgeAnimation[];
}
