export default function Card({ children, style, glow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${glow ? 'var(--border-green-strong)' : 'var(--border-primary)'}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: glow
          ? 'var(--shadow-green)'
          : 'var(--shadow-card)',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
