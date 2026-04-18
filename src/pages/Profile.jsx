import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Clock, Wrench, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from '../components/StatusBadge';

const bc = "'Barlow Condensed', sans-serif";
const mono = "'JetBrains Mono', monospace";

const sectionHdr = {
  fontFamily: bc,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 14,
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sentinelMaint_workOrders');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWorkOrders(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      }
    } catch { /* ignore */ }

    try {
      const stored = localStorage.getItem('sentinel_acknowledged_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAcknowledgedAlerts(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      }
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const infoItems = [
    { label: 'Name',      value: user.name,      icon: User    },
    { label: 'Email',     value: user.email,      icon: Mail    },
    { label: 'Role',      value: user.role,       icon: Shield  },
    { label: 'Specialty', value: user.specialty,  icon: Wrench  },
    { label: 'Shift',     value: user.shift,      icon: Clock   },
    { label: 'User ID',   value: user.id,         icon: null    },
  ];

  const initials = user.avatar || user.name?.split(' ').map(n => n[0]).join('') || '??';
  const roleLabel = user.role ? user.role.toUpperCase() : 'USER';
  const roleColor = user.role === 'admin' ? '#60a5fa' : user.role === 'technician' ? 'var(--status-ok)' : 'var(--text-muted)';

  return (
    <div>
      {/* Cockpit topbar */}
      <div className="cockpit-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: bc, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
            SYS / PLANT-07 / PROFILE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontFamily: bc, fontSize: 20, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              User Profile
            </span>
            <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>
              {user.name}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Avatar card */}
          <div className="cockpit-panel" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 86, height: 86, borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 18px var(--green-glow)',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--green-400)', fontFamily: mono }}>
                {initials}
              </span>
            </div>
            <div style={{ fontFamily: bc, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: 6 }}>
              {user.name}
            </div>
            {/* Role pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 3,
              background: `${roleColor}18`,
              border: `1px solid ${roleColor}40`,
              marginBottom: 6,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: roleColor }} />
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: roleColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                {roleLabel}
              </span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>
              {user.specialty || '—'}
            </div>
          </div>

          {/* Theme toggle */}
          <div className="cockpit-panel" style={{ padding: 14 }}>
            <div style={sectionHdr}>Display</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: mono, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <button
                onClick={toggleTheme}
                style={{
                  padding: '5px 12px', borderRadius: 4,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)', fontSize: 11,
                  fontFamily: bc, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Toggle
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '11px 16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              color: '#f87171', fontSize: 12,
              fontFamily: bc, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* User Information */}
          <div className="cockpit-panel" style={{ padding: 16 }}>
            <div style={sectionHdr}>User Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infoItems.map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 4,
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {item.icon && <item.icon size={13} color="var(--text-muted)" />}
                    <span style={{ fontFamily: bc, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="cockpit-panel" style={{ padding: 16 }}>
            <div style={sectionHdr}>Recent Activity</div>

            {workOrders.length === 0 && acknowledgedAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12, fontFamily: mono }}>
                No recent activity recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {workOrders.map((wo, idx) => (
                  <div key={`wo-${idx}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: 'var(--bg-secondary)', borderRadius: 4,
                    border: '1px solid var(--border-primary)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Wrench size={12} color="var(--green-400)" />
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: mono }}>
                        {wo.title || wo.machine || `Work Order ${wo.id || `#${idx + 1}`}`}
                      </span>
                    </div>
                    {wo.status && <StatusBadge status={wo.status} size="sm" />}
                  </div>
                ))}
                {acknowledgedAlerts.map((alertId, idx) => (
                  <div key={`alert-${idx}`} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px',
                    background: 'var(--bg-secondary)', borderRadius: 4,
                    border: '1px solid var(--border-primary)',
                  }}>
                    <Shield size={12} color="#fbbf24" />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: mono }}>
                      Alert acknowledged: {typeof alertId === 'string' ? alertId : `#${alertId}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
