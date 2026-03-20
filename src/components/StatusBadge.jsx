const colorMap = {
  healthy: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#4ade80', dot: '#22c55e' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', dot: '#f59e0b' },
  critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171', dot: '#ef4444' },
  offline: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#9ca3af', dot: '#6b7280' },
  info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', dot: '#3b82f6' },
  completed: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#4ade80', dot: '#22c55e' },
  'in-progress': { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', dot: '#3b82f6' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const c = colorMap[status] || colorMap.info;
  const pad = size === 'sm' ? '3px 8px' : '4px 12px';
  const fs = size === 'sm' ? 10 : 11;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: pad,
        borderRadius: 4,
        fontSize: fs,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          animation: status === 'critical' ? 'blink 1s ease-in-out infinite' : 'none',
        }}
      />
      {status}
    </span>
  );
}
