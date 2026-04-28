'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '@/lib/types';

const STATUS_DOT: Record<string, { color: string }> = {
  healthy: { color: '#22c55e' },
  degraded: { color: '#eab308' },
  down:     { color: '#ef4444' },
  unknown:  { color: '#374151' },
};

function ServiceNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const dot = STATUS_DOT[nodeData.health.status] ?? STATUS_DOT.unknown;

  return (
    <div
      style={{
        width: 180,
        height: 60,
        background: '#0d0d17',
        border: '1px solid #374151',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-geist-mono), monospace',
        userSelect: 'none',
        padding: '0 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dot.color,
          }}
        />
        <span
          style={{
            color: '#e5e7eb',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nodeData.label}
        </span>
      </div>
      {nodeData.health.errorRate > 0 && (
        <span
          style={{
            color: '#f87171',
            fontSize: 10,
            marginTop: 2,
            letterSpacing: '0.04em',
          }}
        >
          ERR: {(nodeData.health.errorRate * 100).toFixed(1)}%
        </span>
      )}
      {/* Handles on all 4 sides to support TB and LR edge routing */}
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default memo(ServiceNode);
