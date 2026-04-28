'use client';

import { useState, useEffect, useRef } from 'react';
import { MarkerType, type Node, type Edge } from '@xyflow/react';
import type {
  ConnectionStatus,
  HealthInfo,
  ActivityEvent,
  TravelingDot,
  NodeData,
  EdgeData,
} from '@/lib/types';
import { computeDagreLayout, getNodeType, getDbFlavor } from '@/lib/layout';

const WS_URL =
  process.env.NEXT_PUBLIC_TOPOLOGY_WS_URL ?? 'ws://localhost:3001/ws';

const EDGE_MARKER = {
  type: MarkerType.Arrow,
  width: 10,
  height: 10,
  color: 'rgba(255,255,255,0.3)',
};

const MAX_ACTIVITY     = 500;
const FORWARD_MS       = 1400;
const PAUSE_MS         = 200;
const BACKWARD_MS      = 900;
const INTER_SPAN_MS    = 200;
const MAX_QUEUE        = 6;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS  = 30_000;

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
  const nodeType = getNodeType(id);
  return {
    id,
    type: nodeType,
    position: { x: 0, y: 0 },
    data: {
      label: id,
      health: { status: 'unknown', errorRate: 0 },
      nodeType,
      ...(nodeType === 'database' ? { dbFlavor: getDbFlavor(id) } : {}),
    },
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

  // Animation queue
  const animQueueRef   = useRef<ActivityEvent[]>([]);
  const isAnimatingRef = useRef<boolean>(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectDelay = RECONNECT_BASE_MS;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    // Sequential animation runner — plays one span (forward dot → pause → backward dot)
    // then calls itself for the next queued span.
    function runNextSpan() {
      if (animQueueRef.current.length === 0) {
        isAnimatingRef.current = false;
        return;
      }
      isAnimatingRef.current = true;
      const span   = animQueueRef.current.shift()!;
      const edgeId = sanitizeId(`${span.source}->${span.target}`);
      const dotId  = `dot-${span.id}`;

      function addDot(dir: 'forward' | 'backward', dur: number) {
        const dot: TravelingDot = { dotId, direction: dir, status: span.status, duration: dur };
        setEdges((prev) =>
          prev.map((e) =>
            e.id === edgeId
              ? { ...e, data: { ...e.data!, travelingDots: [...(e.data?.travelingDots ?? []), dot] } }
              : e,
          ),
        );
      }

      function removeDot() {
        setEdges((prev) =>
          prev.map((e) =>
            e.id === edgeId
              ? { ...e, data: { ...e.data!, travelingDots: (e.data?.travelingDots ?? []).filter((d) => d.dotId !== dotId) } }
              : e,
          ),
        );
      }

      // Forward travel
      addDot('forward', FORWARD_MS);
      setTimeout(() => {
        if (destroyed) return;
        removeDot();

        // Pause at destination
        setTimeout(() => {
          if (destroyed) return;

          // Backward travel (response)
          addDot('backward', BACKWARD_MS);
          setTimeout(() => {
            if (destroyed) return;
            removeDot();

            // Inter-span gap before next
            setTimeout(() => {
              if (!destroyed) runNextSpan();
            }, INTER_SPAN_MS);
          }, BACKWARD_MS);
        }, PAUSE_MS);
      }, FORWARD_MS);
    }

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
        } catch (err) {
          console.error('[topology] message handling error:', err);
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
        // Always inject the client node — it originates REST calls to services
        const clientNode: Node<NodeData> = {
          id: 'client',
          type: 'client',
          position: { x: 0, y: 0 },
          data: {
            label: 'client',
            health: { status: 'unknown', errorRate: 0 },
            nodeType: 'client',
          },
        };

        const rawNodes: Node<NodeData>[] = [
          clientNode,
          ...(msg.graph.nodes as { id: string; label: string }[])
            .filter((n) => n.id !== 'client') // avoid duplicates if backend also sends it
            .map((n) => {
              const nodeType = getNodeType(n.id);
              return {
                id: n.id,
                type: nodeType as string,
                position: { x: 0, y: 0 } as const,
                data: {
                  label: n.label,
                  health: { status: 'unknown' as const, errorRate: 0 },
                  nodeType,
                  ...(nodeType === 'database' ? { dbFlavor: getDbFlavor(n.id) } : {}),
                },
              };
            }),
        ];

        const rawEdges: Edge<EdgeData>[] = (
          msg.graph.edges as { id: string; source: string; target: string }[]
        ).map((e) => ({
          id: sanitizeId(e.id),
          source: e.source,
          target: e.target,
          type: 'animated' as const,
          markerEnd: EDGE_MARKER,
          data: { travelingDots: [] },
        }));

        const laidOut = computeDagreLayout(rawNodes, rawEdges);
        setNodes(laidOut);
        setEdges(rawEdges);
        return;
      }

      if (msg.type === 'activity') {
        const source = msg.source as string;
        const target = msg.target as string;
        const status = msg.status as 'ok' | 'error';
        const edgeId = sanitizeId(`${source}->${target}`);
        const spanId = `${msg.traceId as string}-${Date.now()}-${Math.random()}`;

        const event: ActivityEvent = {
          id: spanId,
          traceId: msg.traceId as string,
          source,
          target,
          rpcMethod: msg.rpcMethod as string,
          status,
          duration: msg.duration as number,
          ts: Date.now(),
        };

        setRecentActivity((prev) => [event, ...prev].slice(0, MAX_ACTIVITY));

        // Ensure the edge exists (create if missing)
        setEdges((prev) => {
          if (prev.some((e) => e.id === edgeId)) return prev;
          return [
            ...prev,
            {
              id: edgeId,
              source,
              target,
              type: 'animated' as const,
              markerEnd: EDGE_MARKER,
              data: { travelingDots: [] },
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
                  markerEnd: EDGE_MARKER,
                  data: { travelingDots: [] },
                },
              ];
          setNodes(computeDagreLayout(merged, allEdges));
        }

        // Queue span for animation; drop oldest pending if overflow
        if (animQueueRef.current.length >= MAX_QUEUE) {
          animQueueRef.current.shift();
        }
        animQueueRef.current.push(event);
        if (!isAnimatingRef.current) {
          runNextSpan();
        }
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
      // runNextSpan timeouts guard themselves with `destroyed` — no separate tracking needed
    };
  }, []);

  return { nodes, edges, recentActivity, healthMap, connectionStatus };
}
