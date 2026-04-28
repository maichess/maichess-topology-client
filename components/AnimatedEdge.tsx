'use client';

import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { EdgeData } from '@/lib/types';

function AnimatedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as EdgeData | undefined;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Base edge — always visible, dim */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        markerEnd={markerEnd}
      />

      {/* Activity pulse — one per in-flight trace, fades out over 600ms */}
      {(edgeData?.animations ?? []).map(({ animId, status }) => (
        <path
          key={animId}
          d={edgePath}
          fill="none"
          stroke={status === 'ok' ? '#22c55e' : '#ef4444'}
          strokeWidth={3}
          style={{
            pointerEvents: 'none',
            animation: 'edge-pulse 0.6s ease-out forwards',
          }}
        />
      ))}
    </>
  );
}

export default memo(AnimatedEdge);
