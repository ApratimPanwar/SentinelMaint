import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  History,
  BarChart3,
  Shield,
  Radio,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Layout() {
  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <Shield size={20} color="#4ade80" />
          </div>
          <div>
            <div style={styles.logoTitle}>SENTINEL</div>
            <div style={styles.logoSub}>MAINT v2.4</div>
          </div>
        </div>

        {/* System status beacon */}
        <div style={styles.beacon}>
          <Radio size={12} color="#22c55e" style={{ animation: 'phosphorPulse 2s ease-in-out infinite' }} />
          <span style={styles.beaconText}>SYSTEM ONLINE</span>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
              {/* Active indicator bar */}
            </NavLink>
          ))}
        </nav>

        {/* Bottom info */}
        <div style={styles.sidebarFooter}>
          <div style={styles.footerLine}>
            <span style={styles.footerDot} />
            8 machines monitored
          </div>
          <div style={styles.footerLine}>
            <span style={{ ...styles.footerDot, background: '#f59e0b' }} />
            3 active alerts
          </div>
          <div style={styles.footerTimestamp}>
            {new Date().toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* Scanline overlay */}
      <div style={styles.scanlines} />
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#0a0e14',
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: '#0d1117',
    borderRight: '1px solid rgba(34, 197, 94, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    gap: 0,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 16px 16px',
    borderBottom: '1px solid #1e293b',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: 14,
    color: '#4ade80',
    letterSpacing: 2,
    textShadow: '0 0 10px rgba(74,222,128,0.4)',
  },
  logoSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: '#64748b',
    letterSpacing: 1,
  },
  beacon: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
  },
  beaconText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#22c55e',
    letterSpacing: 1.5,
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 8px',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'all 0.15s',
    border: '1px solid transparent',
  },
  navItemActive: {
    color: '#4ade80',
    background: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
    boxShadow: '0 0 12px rgba(34,197,94,0.08)',
  },
  sidebarFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  footerLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'inline-block',
  },
  footerTimestamp: {
    fontSize: 10,
    color: '#475569',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 4,
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
    background: '#0a0e14',
  },
  scanlines: {
    pointerEvents: 'none',
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
  },
};
