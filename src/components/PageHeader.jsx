export default function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: '1px solid #1e293b',
    }}>
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#e2e8f0',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 12,
            color: '#64748b',
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
