'use client';

import { useState, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type {
  ConnectionStatus,
  HealthInfo,
  ActivityEvent,
  EdgeAnimation,
  NodeData,
  EdgeData,
} from '@/lib/types';
import { computeDagreLayout } from '@/lib/layout';

const WS_URL =
  process.env.NEXT_PUBLIC_TOPOLOGY_WS_URL ?? 'ws://localhost:3001/ws';
const MAX_ACTIVITY = 50;
const ANIM_DURATION_MS = 600;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export interface TopologyState {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  recentActivity: ActivityEvent[];
  healthMap: Map<string, HealthInfo>;
  connectionStatus: ConnectionStatus;
}

// Edge IDs from the backend use "source->target" format. The ">" character is
// invalid in CSS selectors, which causes a DOMException in production React when
// it's used in markerEnd="url(#...)" or referenced via querySelector internally.
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function makeUnknownNode(id: string): Node<NodeData> {
  return {
    id,
    type: 'service',
    position: { x: 0, y: 0 },
    data: { label: id, health: { status: 'unknown', errorRate: 0 } },
  };
}

export function useTopologySocket(): TopologyState {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<EdgeData>[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [healthMap, setHealthMap] = useState<Map<string, HealthInfo>>(
    new Map(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  // Refs to read latest state inside the WS handler closure without stale captures
  const nodesRef = useRef<Node<NodeData>[]>([]);
  const edgesRef = useRef<Edge<EdgeData>[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectDelay = RECONNECT_BASE_MS;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;
    const animTimers = new Map<number, ReturnType<typeof setTimeout>>();

    function connect() {
      if (destroyed) return;
      setConnectionStatus('reconnecting');

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (destroyed) { ws?.close(); return; }
        reconnectDelay = RECONNECT_BASE_MS;
        setConnectionStatus('live');
      };

      ws.onmessage = (event: MessageEvent) => {
        if (destroyed) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = JSON.parse(event.data as string) as any;
          handleMessage(msg);
        } catch {
          // malformed message — ignore
        }
      };

      ws.onerror = () => {
        // onclose fires after onerror; handle reconnect there
      };

      ws.onclose = () => {
        if (destroyed) return;
        setConnectionStatus('disconnected');
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
          connect();
        }, reconnectDelay);
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleMessage(msg: any) {
      if (msg.type === 'init') {
        const rawNodes: Node<NodeData>[] = (
          msg.graph.nodes as { id: string; label: string }[]
        ).map((n) => ({
          id: n.id,
          type: 'service' as const,
          position: { x: 0, y: 0 },
          data: { label: n.label, health: { status: 'unknown' as const, errorRate: 0 } },
        }));

        const rawEdges: Edge<EdgeData>[] = (
          msg.graph.edges as { id: string; source: string; target: string }[]
        ).map((e) => ({
          id: sanitizeId(e.id),
          source: e.source,
          target: e.target,
          type: 'animated' as const,
          data: { animations: [] },
        }));

        const laidOut = computeDagreLayout(rawNodes, rawEdges);
        setNodes(laidOut);
        setEdges(rawEdges);
        return;
      }

      if (msg.type === 'activity') {
        const animId = Date.now() + Math.random();
        const source = msg.source as string;
        const target = msg.target as string;
        const status = msg.status as 'ok' | 'error';
        const edgeId = sanitizeId(`${source}->${target}`);

        const event: ActivityEvent = {
          id: `${msg.traceId as string}-${animId}`,
          traceId: msg.traceId as string,
          source,
          target,
          rpcMethod: msg.rpcMethod as string,
          status,
          duration: msg.duration as number,
          ts: Date.now(),
        };

        setRecentActivity((prev) => [event, ...prev].slice(0, MAX_ACTIVITY));

        setEdges((prev) => {
          const exists = prev.some((e) => e.id === edgeId);
          if (exists) {
            return prev.map((e) =>
              e.id === edgeId
                ? {
                    ...e,
                    data: {
                      ...e.data!,
                      animations: [
                        ...(e.data?.animations ?? []),
                        { animId, status } satisfies EdgeAnimation,
                      ],
                    },
                  }
                : e,
            );
          }
          return [
            ...prev,
            {
              id: edgeId,
              source,
              target,
              type: 'animated' as const,
              data: { animations: [{ animId, status } satisfies EdgeAnimation] },
            },
          ];
        });

        // Upsert nodes if missing — use refs to avoid stale closure
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const sourceExists = currentNodes.some((n) => n.id === source);
        const targetExists = currentNodes.some((n) => n.id === target);

        if (!sourceExists || !targetExists) {
          const additions: Node<NodeData>[] = [];
          if (!sourceExists) additions.push(makeUnknownNode(source));
          if (!targetExists) additions.push(makeUnknownNode(target));
          const merged = [...currentNodes, ...additions];
          const allEdges = currentEdges.some((e) => e.id === edgeId)
            ? currentEdges
            : [
                ...currentEdges,
                {
                  id: edgeId,
                  source,
                  target,
                  type: 'animated' as const,
                  data: { animations: [] },
                },
              ];
          setNodes(computeDagreLayout(merged, allEdges));
        }

        // Remove animation after duration
        const timer = setTimeout(() => {
          setEdges((prev) =>
            prev.map((e) =>
              e.id === edgeId
                ? {
                    ...e,
                    data: {
                      ...e.data!,
                      animations: (e.data?.animations ?? []).filter(
                        (a) => a.animId !== animId,
                      ),
                    },
                  }
                : e,
            ),
          );
          animTimers.delete(animId);
        }, ANIM_DURATION_MS);

        animTimers.set(animId, timer);
        return;
      }

      if (msg.type === 'health') {
        const service = msg.service as string;
        const health: HealthInfo = {
          status: msg.status as HealthInfo['status'],
          errorRate: (msg.errorRate as number) ?? 0,
        };
        setHealthMap((prev) => new Map(prev).set(service, health));
        setNodes((prev) =>
          prev.map((n) =>
            n.id === service ? { ...n, data: { ...n.data, health } } : n,
          ),
        );
      }
    }

    connect();

    return () => {
      destroyed = true;
      ws?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      for (const t of animTimers.values()) clearTimeout(t);
      animTimers.clear();
    };
  }, []);

  return { nodes, edges, recentActivity, healthMap, connectionStatus };
}
