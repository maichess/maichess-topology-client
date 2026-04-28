'use client';

import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { EdgeData, TravelingDot } from '@/lib/types';

const DOT_COLOR: Record<'ok' | 'error', { forward: string; backward: string }> = {
  ok:    { forward: '#22c55e', backward: '#166534' },
  error: { forward: '#ef4444', backward: '#7f1d1d' },
};

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

  if (!edgePath) return null;

  const dots: TravelingDot[] = edgeData?.travelingDots ?? [];

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

      {/* Traveling dot per queued span — animateMotion follows the bezier path */}
      {dots.map(({ dotId, direction, status, duration }) => {
        const colors = DOT_COLOR[status];
        const fill = direction === 'forward' ? colors.forward : colors.backward;
        const kp   = direction === 'forward' ? '0;1' : '1;0';
        return (
          <circle key={dotId} r={5} fill={fill} style={{ pointerEvents: 'none' }}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore — `path` is a valid SMIL animateMotion attribute */}
            <animateMotion
              path={edgePath}
              dur={`${duration}ms`}
              fill="freeze"
              keyPoints={kp}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        );
      })}
    </>
  );
}

export default memo(AnimatedEdge);
