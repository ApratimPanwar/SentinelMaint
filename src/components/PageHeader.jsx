export default function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: '1px solid var(--border-primary)',
    }}>
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 4,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </div>
  );
}
