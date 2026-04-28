@AGENTS.md

# maichess-topology-client

Live service topology visualization for the maichess platform. Connects to a WebSocket
server, renders a real-time directed graph of microservice interactions, and shows
per-service health status.

## What it does

- On connect: receives the known service graph (nodes + edges) and renders it with
  automatic left-to-right layout (dagre)
- On each gRPC span: animates a traveling dot along the relevant edge and logs the
  event to the activity feed
- Every 5 seconds: updates node border color and error-rate badge based on health status
- Reconnects automatically with exponential backoff on WebSocket failure

## WebSocket Protocol

Connect to `NEXT_PUBLIC_TOPOLOGY_WS_URL`.

### `init` — sent once on connect
```json
{
  "type": "init",
  "graph": {
    "nodes": [{ "id": "auth-service", "label": "auth-service" }],
    "edges": [{ "id": "e1", "source": "auth-service", "target": "user-db" }]
  }
}
```

### `activity` — sent per gRPC CLIENT span
```json
{
  "type": "activity",
  "traceId": "abc123",
  "source": "auth-service",
  "target": "user-db",
  "rpcMethod": "/maichess.user.Users/GetUser",
  "status": "ok",
  "duration": 14
}
```

### `health` — sent every 5 seconds per service
```json
{
  "type": "health",
  "service": "auth-service",
  "status": "healthy",
  "errorRate": 0.0
}
```
`status` is one of: `"healthy"` | `"degraded"` | `"down"`

## Data Model

- **ServiceStatus**: `'healthy' | 'degraded' | 'down' | 'unknown'`
- **NodeData**: `{ label: string; health: HealthInfo }` — attached to each React Flow node
- **EdgeData**: `{ animations: EdgeAnimation[] }` — list of in-flight dot animations
- **ActivityEvent**: last 50 events, newest first, shown in the activity feed

## Key Architectural Decisions

- **No OTel tracing**: This app reads spans from the topology backend. Adding OTel here
  would create a feedback loop (the app would generate spans that get processed and
  re-broadcast to itself).

- **`ssr: false` dynamic import**: React Flow uses `ResizeObserver`, `window`, and
  `document`. These don't exist in the Next.js SSR environment. The `dynamic()` call
  with `ssr: false` in `app/page.tsx` prevents SSR for `TopologyGraph`. Per Next.js 16
  docs, this call must live in a `'use client'` file.

- **dagre layout on `init` only**: Layout runs once when the `init` message arrives.
  Subsequent `activity` and `health` messages do not re-layout, preserving any node
  positions the user has manually dragged.

- **SVG `animateMotion` for traveling dots**: Each in-flight trace renders an SVG
  `<circle>` with a native `<animateMotion>` that follows the edge bezier path. This
  avoids JS RAF loops and handles multiple concurrent traces on the same edge cleanly
  (one circle per animation).

- **Exponential backoff reconnect**: WebSocket reconnect starts at 1s, doubles each
  failure, caps at 30s. State stays intact across reconnects.

- **Stale closure prevention**: The `useTopologySocket` hook uses `nodesRef`/`edgesRef`
  (refs mirroring state) so the WebSocket message handler can read the latest node/edge
  state without a stale closure inside the `useEffect`.

## Key Files

| File | Purpose |
|------|---------|
| `hooks/useTopologySocket.ts` | All WebSocket logic and state management |
| `components/AnimatedEdge.tsx` | SVG animateMotion traveling-dot edge |
| `components/ServiceNode.tsx` | Health-colored node card |
| `components/TopologyGraph.tsx` | React Flow canvas with dagre layout |
| `components/ActivityFeed.tsx` | Collapsible right-side event log |
| `lib/layout.ts` | Dagre layout computation |
| `lib/types.ts` | Shared TypeScript interfaces |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TOPOLOGY_WS_URL` | WebSocket endpoint (required) |

## Running

```bash
npm install
npm run dev      # http://localhost:3000 (Turbopack, watch mode)
npm run build    # production build
npm start        # serve production build
```

## Known Gotchas

- `@xyflow/react/dist/style.css` is imported in `TopologyGraph.tsx`. If Turbopack
  rejects it there, move it to `app/globals.css` as `@import "@xyflow/react/dist/style.css"`.
- `nodeTypes` and `edgeTypes` in `TopologyGraph.tsx` are module-level constants. Moving
  them inside the component will cause React Flow to re-register them on every render.
- `edge.data` is typed as optional on React Flow `Edge<T>`. Always use `edge.data?.animations ?? []`.
