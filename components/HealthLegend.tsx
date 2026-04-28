const LEGEND = [
  { status: 'healthy', color: '#22c55e', label: 'Healthy' },
  { status: 'degraded', color: '#eab308', label: 'Degraded' },
  { status: 'down', color: '#ef4444', label: 'Down' },
  { status: 'unknown', color: '#374151', label: 'Unknown' },
];

export default function HealthLegend() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        background: 'rgba(10, 10, 15, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '8px 12px',
        zIndex: 10,
        backdropFilter: 'blur(4px)',
      }}
    >
      {LEGEND.map(({ status, color, label }) => (
        <div
          key={status}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            fontSize: 11,
            fontFamily: 'var(--font-geist-mono)',
            color: '#6b7280',
          }}
        >
          <span style={{ color, fontSize: 10, lineHeight: 1 }}>●</span>
          {label}
        </div>
      ))}
    </div>
  );
}
