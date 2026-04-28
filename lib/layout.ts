import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData, EdgeData, NodeType, DbFlavor } from './types';

export const NODE_DIMS: Record<NodeType, { width: number; height: number }> = {
  client:   { width: 180, height: 50 },
  service:  { width: 180, height: 60 },
  database: { width: 140, height: 96 }, // 18 (top ellipse) + 60 (body) + 18 (bottom ellipse)
};

export function getNodeType(id: string): NodeType {
  if (id === 'client') return 'client';
  if (/redis|postgres|mongo|mysql|elasticsearch|db(-service)?$|database/i.test(id))
    return 'database';
  return 'service';
}

export function getDbFlavor(id: string): DbFlavor {
  if (/redis/i.test(id))    return 'redis';
  if (/postgres/i.test(id)) return 'postgres';
  if (/mongo/i.test(id))    return 'mongo';
  if (/mysql/i.test(id))    return 'mysql';
  return 'generic';
}

export function computeDagreLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
): Node<NodeData>[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    ranksep: 200,
    nodesep: 120,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    const dims = NODE_DIMS[node.data.nodeType ?? 'service'];
    g.setNode(node.id, { width: dims.width, height: dims.height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const dims = NODE_DIMS[node.data.nodeType ?? 'service'];
    return {
      ...node,
      position: {
        x: pos.x - dims.width / 2,
        y: pos.y - dims.height / 2,
      },
    };
  });
}
