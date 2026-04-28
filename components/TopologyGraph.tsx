'use client';

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ServiceNode  from './ServiceNode';
import ClientNode   from './ClientNode';
import DatabaseNode from './DatabaseNode';
import AnimatedEdge from './AnimatedEdge';
import type { NodeData, EdgeData } from '@/lib/types';

// Must be module-level constants — defining inside the component causes
// React Flow to re-register types on every render (warning + visual glitch)
const nodeTypes = {
  service:  ServiceNode,
  client:   ClientNode,
  database: DatabaseNode,
};
const edgeTypes = { animated: AnimatedEdge };

interface TopologyGraphProps {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

function TopologyGraphInner({ nodes, edges }: TopologyGraphProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable={false}
      colorMode="dark"
      style={{ background: '#0a0a0f' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(255,255,255,0.05)"
      />
      <Controls />
    </ReactFlow>
  );
}

export default function TopologyGraph({ nodes, edges }: TopologyGraphProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <TopologyGraphInner nodes={nodes} edges={edges} />
      </ReactFlowProvider>
    </div>
  );
}
