/** Cockpit-style page topbar — consistent across all pages */
export default function PageHeader({ title, subtitle, breadcrumb, children }) {
  return (
    <div
      className="cockpit-panel"
      style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}>
          SYS / PLANT-07 {breadcrumb ? `/ ${breadcrumb}` : ''}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            {title}
          </span>
          {subtitle && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {children && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}
