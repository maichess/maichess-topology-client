import type { ConnectionStatus } from '@/lib/types';

const CONFIG: Record<
  ConnectionStatus,
  { color: string; label: string; pulse: boolean }
> = {
  live: { color: '#22c55e', label: 'LIVE', pulse: true },
  reconnecting: { color: '#eab308', label: 'RECONNECTING...', pulse: false },
  disconnected: { color: '#ef4444', label: 'DISCONNECTED', pulse: false },
};

export default function ConnectionStatus({
  status,
}: {
  status: ConnectionStatus;
}) {
  const { color, label, pulse } = CONFIG[status];

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 316,
        background: 'rgba(10, 10, 15, 0.85)',
        border: `1px solid ${color}33`,
        borderRadius: 20,
        padding: '4px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 11,
        fontFamily: 'var(--font-geist-mono)',
        fontSize: 11,
        color: '#e5e7eb',
        letterSpacing: '0.08em',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
          animation: pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }}
      />
      {label}
    </div>
  );
}
