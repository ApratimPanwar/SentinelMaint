export default function Card({ children, style, glow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#111820',
        border: `1px solid ${glow ? 'rgba(34,197,94,0.25)' : '#1e293b'}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: glow
          ? '0 0 15px rgba(34,197,94,0.08), 0 0 30px rgba(34,197,94,0.04)'
          : '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
