'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '@/lib/types';

function ClientNode({ data }: NodeProps) {
  const { label } = data as NodeData;
  return (
    <div
      style={{
        width: 180,
        height: 50,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0d0d17 100%)',
        border: '1px solid #6366f1',
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-geist-mono), monospace',
        userSelect: 'none',
      }}
    >
      <span style={{ color: '#818cf8', fontSize: 14 }}>◈</span>
      <span
        style={{
          color: '#c7d2fe',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default memo(ClientNode);
