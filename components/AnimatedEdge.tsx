'use client';

import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { EdgeData } from '@/lib/types';

function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
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

  // Sanitize: HTML element IDs and URL fragments cannot contain chars like > < spaces
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pathId = `edge-path-${safeId}`;
  const markerId = `arrow-${safeId}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.25)" />
        </marker>
      </defs>

      <path
        id={pathId}
        d={edgePath}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
      />

      {(edgeData?.animations ?? []).map(({ animId, status }) => (
        <circle
          key={animId}
          r={3}
          fill={status === 'ok' ? '#22c55e' : '#ef4444'}
        >
          {/* SVG animateMotion: traveling dot along the edge path */}
          <animateMotion dur="0.6s" fill="remove" repeatCount="1">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

export default memo(AnimatedEdge);
