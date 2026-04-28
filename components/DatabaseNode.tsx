'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData, DbFlavor } from '@/lib/types';

const FLAVOR: Record<DbFlavor, { accent: string; bg: string }> = {
  redis:    { accent: '#ef4444', bg: '#1c0a0a' },
  postgres: { accent: '#3b82f6', bg: '#090d1c' },
  mongo:    { accent: '#22c55e', bg: '#0a1c0d' },
  mysql:    { accent: '#f59e0b', bg: '#1c160a' },
  generic:  { accent: '#6b7280', bg: '#111827' },
};

function DatabaseNode({ data }: NodeProps) {
  const { label, dbFlavor, health } = data as NodeData;
  const { accent, bg } = FLAVOR[dbFlavor ?? 'generic'];

  const ellipseStyle: React.CSSProperties = {
    width: 140,
    height: 18,
    background: bg,
    border: `1px solid ${accent}88`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <div
      style={{
        width: 140,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      {/* Top ellipse */}
      <div style={{ ...ellipseStyle, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 9, color: accent, letterSpacing: '0.08em' }}>
          {(dbFlavor ?? 'db').toUpperCase()}
        </span>
      </div>

      {/* Cylinder body */}
      <div
        style={{
          width: 140,
          height: 60,
          background: bg,
          borderLeft: `1px solid ${accent}55`,
          borderRight: `1px solid ${accent}55`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: '#e5e7eb',
            fontSize: 12,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
        {health.errorRate > 0 && (
          <span style={{ color: '#f87171', fontSize: 10, marginTop: 2 }}>
            ERR: {(health.errorRate * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Bottom ellipse */}
      <div style={{ ...ellipseStyle, position: 'relative', top: -1 }} />

      {/* Handles on all 4 sides */}
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none', top: 9 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none', bottom: 9 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default memo(DatabaseNode);
