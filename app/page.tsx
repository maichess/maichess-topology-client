'use client';

import dynamic from 'next/dynamic';
import { useTopologySocket } from '@/hooks/useTopologySocket';
import ActivityFeed from '@/components/ActivityFeed';
import HealthLegend from '@/components/HealthLegend';
import ConnectionStatus from '@/components/ConnectionStatus';

// ssr: false must be in a 'use client' file (Next.js 16 requirement)
// React Flow uses ResizeObserver, window, and document — not available in SSR
const TopologyGraph = dynamic(() => import('@/components/TopologyGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span
        style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: 12,
          color: '#374151',
          letterSpacing: '0.08em',
        }}
      >
        LOADING GRAPH RENDERER...
      </span>
    </div>
  ),
});

export default function Page() {
  const { nodes, edges, recentActivity, connectionStatus } =
    useTopologySocket();

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#0a0a0f' }}
    >
      {nodes.length === 0 && connectionStatus === 'disconnected' ? (
        <div className="flex h-full w-full items-center justify-center">
          <p
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 12,
              color: '#374151',
              letterSpacing: '0.08em',
            }}
          >
            WAITING FOR TOPOLOGY DATA...
          </p>
        </div>
      ) : (
        <TopologyGraph nodes={nodes} edges={edges} />
      )}

      <ActivityFeed activities={recentActivity} />
      <HealthLegend />
      <ConnectionStatus status={connectionStatus} />
    </div>
  );
}
