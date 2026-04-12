import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Clock, Wrench, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);

  useEffect(() => {
    // Load recent work orders
    try {
      const stored = localStorage.getItem('sentinelMaint_workOrders');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWorkOrders(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      }
    } catch {
      // ignore
    }

    // Load acknowledged alerts
    try {
      const stored = localStorage.getItem('sentinel_acknowledged_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAcknowledgedAlerts(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const infoItems = [
    { label: 'Name', value: user.name, icon: User },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: user.role, icon: Shield, badge: true },
    { label: 'Specialty', value: user.specialty, icon: Wrench },
    { label: 'Shift', value: user.shift, icon: Clock },
    { label: 'User ID', value: user.id, icon: null },
  ];

  return (
    <div>
      <PageHeader title="User Profile" subtitle={`Logged in as ${user.name}`} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* Left column: Avatar + Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ textAlign: 'center', padding: 32 }}>
            {/* Avatar */}
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--bg-secondary, #0d1117)',
              border: '3px solid var(--green-400, #4ade80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 20px var(--green-glow, rgba(34,197,94,0.15))',
            }}>
              <span style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'var(--green-400, #4ade80)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {user.avatar || user.name?.split(' ').map(n => n[0]).join('') || '??'}
              </span>
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary, #e2e8f0)',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 4,
            }}>
              {user.name}
            </div>
            <div style={{ marginBottom: 4 }}>
              <StatusBadge status={user.role === 'admin' ? 'critical' : 'healthy'} size="md" />
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted, #64748b)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {user.specialty}
            </div>
          </Card>

          {/* Theme toggle */}
          <Card>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Theme
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: 12,
                color: 'var(--text-secondary, #94a3b8)',
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <button
                onClick={toggleTheme}
                style={{
                  padding: '6px 14px',
                  background: 'var(--bg-secondary, #0d1117)',
                  border: '1px solid var(--border-primary, #1e293b)',
                  borderRadius: 6,
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Toggle
              </button>
            </div>
          </Card>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239,68,68,0.2)';
              e.target.style.borderColor = 'rgba(239,68,68,0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239,68,68,0.1)';
              e.target.style.borderColor = 'rgba(239,68,68,0.3)';
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Right column: Info + Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* User Info Card */}
          <Card>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 16,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              User Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {infoItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary, #0d1117)',
                    borderRadius: 6,
                    border: '1px solid var(--border-primary, #1e293b)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    {item.icon && <item.icon size={14} color="var(--text-muted, #64748b)" />}
                    <span style={{
                      fontSize: 11,
                      color: 'var(--text-muted, #64748b)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge ? (
                    <StatusBadge
                      status={user.role === 'admin' ? 'critical' : 'healthy'}
                      size="sm"
                    />
                  ) : (
                    <span style={{
                      fontSize: 13,
                      color: 'var(--text-primary, #e2e8f0)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 500,
                    }}>
                      {item.value || '—'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 16,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Recent Activity
            </div>

            {workOrders.length === 0 && acknowledgedAlerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--text-muted, #64748b)',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                No recent activity recorded
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Work Orders */}
                {workOrders.map((wo, idx) => (
                  <div
                    key={`wo-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary, #0d1117)',
                      borderRadius: 6,
                      border: '1px solid var(--border-primary, #1e293b)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <Wrench size={12} color="var(--green-400, #4ade80)" />
                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-primary, #e2e8f0)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {wo.title || wo.machine || `Work Order #${wo.id || idx + 1}`}
                      </span>
                    </div>
                    {wo.status && <StatusBadge status={wo.status} size="sm" />}
                  </div>
                ))}

                {/* Acknowledged Alerts */}
                {acknowledgedAlerts.map((alertId, idx) => (
                  <div
                    key={`alert-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: 'var(--bg-secondary, #0d1117)',
                      borderRadius: 6,
                      border: '1px solid var(--border-primary, #1e293b)',
                    }}
                  >
                    <Shield size={12} color="#fbbf24" />
                    <span style={{
                      fontSize: 12,
                      color: 'var(--text-primary, #e2e8f0)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Alert acknowledged: {typeof alertId === 'string' ? alertId : `#${alertId}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
