export default function HealthBar({ value, height = 6 }) {
  const color =
    value >= 80 ? '#22c55e' :
    value >= 50 ? '#f59e0b' :
    value > 0  ? '#ef4444' : '#374151';
  const glow =
    value >= 80 ? 'rgba(34,197,94,0.3)' :
    value >= 50 ? 'rgba(245,158,11,0.3)' :
    value > 0  ? 'rgba(239,68,68,0.3)' : 'transparent';

  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#1e293b',
        borderRadius: height / 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${Math.max(value, 0)}%`,
          height: '100%',
          background: color,
          borderRadius: height / 2,
          boxShadow: `0 0 8px ${glow}`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}
