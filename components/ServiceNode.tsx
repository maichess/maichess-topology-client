'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '@/lib/types';

const STATUS_STYLES: Record<
  string,
  { border: string; shadow: string }
> = {
  healthy: {
    border: '#22c55e',
    shadow: '0 0 8px 2px rgba(34,197,94,0.5)',
  },
  degraded: {
    border: '#eab308',
    shadow: '0 0 8px 2px rgba(234,179,8,0.5)',
  },
  down: {
    border: '#ef4444',
    shadow: '0 0 8px 2px rgba(239,68,68,0.5)',
  },
  unknown: {
    border: '#374151',
    shadow: 'none',
  },
};

function ServiceNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const style = STATUS_STYLES[nodeData.health.status] ?? STATUS_STYLES.unknown;

  return (
    <div
      style={{
        width: 200,
        height: 60,
        background: '#0d0d17',
        border: `1px solid ${style.border}`,
        boxShadow: style.shadow,
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
      <span
        style={{
          color: '#e5e7eb',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {nodeData.label}
      </span>
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
      {/* Handles are required for edges to attach correctly */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}

export default memo(ServiceNode);
