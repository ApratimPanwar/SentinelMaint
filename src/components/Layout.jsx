import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  History,
  BarChart3,
  Shield,
  Radio,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function getInitials(user) {
  if (!user) return '?';
  if (user.name) {
    return user.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.email) return user.email[0].toUpperCase();
  return '?';
}

export default function Layout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <Shield size={20} color="var(--green-500)" />
          </div>
          <div>
            <div style={styles.logoTitle}>SENTINEL</div>
            <div style={styles.logoSub}>MAINT v2.4</div>
          </div>
        </div>

        {/* System status beacon */}
        <div style={styles.beacon}>
          <Radio size={12} color="var(--status-ok)" style={{ animation: 'phosphorPulse 2s ease-in-out infinite' }} />
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
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <NavLink to="/profile" style={styles.userSection}>
            <div style={styles.userAvatar}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={styles.userAvatarImg}
                />
              ) : (
                <span style={styles.userInitials}>{getInitials(user)}</span>
              )}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name || 'User'}</div>
              <div style={styles.userRole}>{user.role || 'Operator'}</div>
            </div>
          </NavLink>
        )}

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
          <div style={styles.footerRow}>
            <div style={styles.footerTimestamp}>
              {new Date().toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
              })}
            </div>
            <button
              onClick={toggleTheme}
              style={styles.themeToggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* Scanline overlay — more subtle in light mode */}
      <div
        style={{
          ...styles.scanlines,
          opacity: theme === 'dark' ? 1 : 0.3,
        }}
      />
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-green)',
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
    borderBottom: '1px solid var(--border-primary)',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--green-glow)',
    border: '1px solid var(--border-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--green-500)',
    letterSpacing: 2,
    textShadow: '0 0 10px rgba(74,222,128,0.4)',
  },
  logoSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: 1,
  },
  beacon: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-primary)',
  },
  beaconText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: 'var(--status-ok)',
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
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.15s',
    border: '1px solid transparent',
  },
  navItemActive: {
    color: 'var(--green-500)',
    background: 'var(--green-glow)',
    border: '1px solid var(--border-green)',
    boxShadow: '0 0 12px var(--green-glow)',
  },

  /* User info section */
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderTop: '1px solid var(--border-primary)',
    textDecoration: 'none',
    transition: 'background 0.15s',
    cursor: 'pointer',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--green-glow)',
    border: '1px solid var(--border-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  userInitials: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--green-500)',
    letterSpacing: 1,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'capitalize',
  },

  /* Sidebar footer */
  sidebarFooter: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  footerLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--status-ok)',
    display: 'inline-block',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerTimestamp: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  themeToggle: {
    background: 'none',
    border: '1px solid var(--border-primary)',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },

  /* Main content */
  main: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
    background: 'var(--bg-primary)',
  },

  /* Scanline overlay */
  scanlines: {
    pointerEvents: 'none',
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
  },
};
