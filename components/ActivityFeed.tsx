'use client';

import { useMemo, useState } from 'react';
import type { ActivityEvent, TraceGroup } from '@/lib/types';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

function groupByTrace(activities: ActivityEvent[]): TraceGroup[] {
  const map = new Map<string, TraceGroup>();
  for (const a of activities) {
    if (!map.has(a.traceId)) {
      map.set(a.traceId, {
        traceId: a.traceId,
        spans: [],
        firstTs: a.ts,
        lastStatus: 'ok',
      });
    }
    const g = map.get(a.traceId)!;
    g.spans.push(a);
    if (a.ts < g.firstTs) g.firstTs = a.ts;
    if (a.status === 'error') g.lastStatus = 'error';
  }
  return Array.from(map.values())
    .sort((a, b) => b.firstTs - a.firstTs)
    .slice(0, 50);
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());

  const traces = useMemo(() => groupByTrace(activities), [activities]);

  function toggleTrace(traceId: string) {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(traceId)) next.delete(traceId);
      else next.add(traceId);
      return next;
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 300,
        transform: collapsed ? 'translateX(272px)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        background: 'rgba(10, 10, 15, 0.92)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand activity feed' : 'Collapse activity feed'}
        style={{
          position: 'absolute',
          left: -28,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(10, 10, 15, 0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRight: 'none',
          color: '#6b7280',
          width: 28,
          height: 48,
          cursor: 'pointer',
          borderRadius: '4px 0 0 4px',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        {collapsed ? '‹' : '›'}
      </button>

      {/* Header */}
      <div
        style={{
          padding: '12px 12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: '#4b5563',
            fontFamily: 'var(--font-geist-mono)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Traces
        </span>
        <span
          style={{
            float: 'right',
            fontSize: 10,
            color: '#374151',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          {traces.length}
        </span>
      </div>

      {/* Trace list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {traces.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: '#374151',
              fontSize: 11,
              fontFamily: 'var(--font-geist-mono)',
            }}
          >
            Waiting for activity...
          </div>
        ) : (
          traces.map((group) => {
            const isExpanded = expandedTraces.has(group.traceId);
            const shortId = group.traceId.slice(0, 8);
            return (
              <div
                key={group.traceId}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Trace header row */}
                <div
                  onClick={() => toggleTrace(group.traceId)}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    fontFamily: 'var(--font-geist-mono)',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortId}
                  </span>
                  <span style={{ fontSize: 9, color: '#4b5563', flexShrink: 0 }}>
                    {group.spans.length}
                  </span>
                  <span
                    style={{
                      color: group.lastStatus === 'ok' ? '#22c55e' : '#ef4444',
                      fontSize: 8,
                      flexShrink: 0,
                    }}
                  >
                    ●
                  </span>
                </div>

                {/* Expanded span list */}
                {isExpanded &&
                  group.spans.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '4px 12px 4px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        fontFamily: 'var(--font-geist-mono)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          <span style={{ color: '#6b7280' }}>{a.source}</span>
                          <span style={{ color: '#374151', margin: '0 3px' }}>→</span>
                          <span style={{ color: '#6b7280' }}>{a.target}</span>
                        </span>
                        <span
                          style={{
                            color: a.status === 'ok' ? '#22c55e' : '#ef4444',
                            fontSize: 8,
                            flexShrink: 0,
                          }}
                        >
                          ●
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: '#4b5563',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.rpcMethod}
                        <span style={{ color: '#374151', marginLeft: 6 }}>
                          {a.duration}ms
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
