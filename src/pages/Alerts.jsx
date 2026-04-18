import { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle, Bell, BellOff, Plus, X,
} from 'lucide-react';
import { alerts as mockAlerts, machines } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const LS_KEYS = {
  dismissed: 'sentinel_dismissed_alerts',
  acknowledged: 'sentinel_acknowledged_alerts',
  manual: 'sentinel_manual_alerts',
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const severityIcon = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const severityColor = {
  critical: 'var(--status-critical)',
  warning: 'var(--status-warn)',
  info: '#3b82f6',
};

const severityHex = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 10,
  color: 'var(--text-muted)',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
};

export default function Alerts() {
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  const [dismissed, setDismissed] = useState(() =>
    loadJson(LS_KEYS.dismissed, [])
  );

  const [acknowledged, setAcknowledged] = useState(() => {
    const saved = loadJson(LS_KEYS.acknowledged, null);
    if (saved) return saved;
    return Object.fromEntries(mockAlerts.map(a => [a.id, a.acknowledged ? { by: 'System', at: new Date().toISOString() } : false]));
  });

  const [manualAlerts, setManualAlerts] = useState(() =>
    loadJson(LS_KEYS.manual, [])
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    machineId: machines[0]?.id || '',
    severity: 'warning',
    type: '',
    message: '',
  });

  useEffect(() => {
    localStorage.setItem(LS_KEYS.dismissed, JSON.stringify(dismissed));
  }, [dismissed]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.acknowledged, JSON.stringify(acknowledged));
  }, [acknowledged]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.manual, JSON.stringify(manualAlerts));
  }, [manualAlerts]);

  const allAlerts = [...mockAlerts, ...manualAlerts].filter(
    a => !dismissed.includes(a.id)
  );

  const filtered = allAlerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !acknowledged[a.id];
    return a.severity === filter;
  });

  const handleAck = (id) => {
    setAcknowledged(prev => ({ ...prev, [id]: { by: user?.name || 'Unknown', at: new Date().toISOString() } }));
  };

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.type.trim() || !form.message.trim()) return;

    const machine = machines.find(m => m.id === form.machineId);
    const newAlert = {
      id: `MAN-${Date.now()}`,
      machineId: form.machineId,
      machineName: machine?.name || form.machineId,
      severity: form.severity,
      type: form.type.trim(),
      message: form.message.trim(),
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    setManualAlerts(prev => [newAlert, ...prev]);
    setAcknowledged(prev => ({ ...prev, [newAlert.id]: false }));
    setForm({ machineId: machines[0]?.id || '', severity: 'warning', type: '', message: '' });
    setShowForm(false);
  };

  const getAckLabel = (ackValue) => {
    if (!ackValue) return null;
    if (ackValue === true) return 'Unknown';
    if (typeof ackValue === 'object' && ackValue.by) return ackValue.by;
    return 'Unknown';
  };

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    warning: allAlerts.filter(a => a.severity === 'warning').length,
    info: allAlerts.filter(a => a.severity === 'info').length,
    unack: allAlerts.filter(a => !acknowledged[a.id]).length,
  };

  return (
    <div>
      <PageHeader title="Active Alerts" breadcrumb="ALERTS" subtitle={`${counts.unack} unacknowledged`}>
        <button
          onClick={() => setShowForm(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 4,
            border: '1px solid var(--border-green)',
            background: 'var(--green-glow)',
            color: 'var(--green-500)', fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={13} /> Add Alert
        </button>
        <div style={{
          display: 'flex', gap: 3, background: 'var(--bg-secondary)', borderRadius: 4,
          border: '1px solid var(--border-primary)', padding: 3,
        }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'critical', label: `Critical (${counts.critical})` },
            { key: 'warning', label: `Warn (${counts.warning})` },
            { key: 'unacknowledged', label: `Unacked (${counts.unack})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '4px 9px', borderRadius: 3, border: 'none', fontSize: 11,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                background: filter === f.key ? 'rgba(34,197,94,0.15)' : 'transparent',
                color: filter === f.key ? 'var(--green-500)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Add Alert Form */}
      {showForm && (
        <div className="cockpit-panel" style={{ padding: 16, marginBottom: 12, borderLeft: '3px solid var(--green-500)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14, fontWeight: 700,
                color: 'var(--green-500)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Create Manual Alert
              </span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Machine</label>
                <select
                  value={form.machineId}
                  onChange={e => setForm(prev => ({ ...prev, machineId: e.target.value }))}
                  style={inputStyle}
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.id} — {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Severity</label>
                <select
                  value={form.severity}
                  onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Alert Type</label>
              <input
                type="text"
                placeholder="e.g. Bearing Failure Imminent"
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                placeholder="Describe the alert condition..."
                rows={3}
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '7px 18px', borderRadius: 4,
                border: '1px solid var(--border-green)',
                background: 'var(--green-glow)',
                color: 'var(--green-500)', fontSize: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Submit Alert
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: 4 }}>
        {filtered.map(alert => {
          const Icon = severityIcon[alert.severity] || Info;
          const color = severityColor[alert.severity];
          const hex = severityHex[alert.severity] || '#94a3b8';
          const isAcked = acknowledged[alert.id];
          const ackName = getAckLabel(isAcked);

          return (
            <div key={alert.id} className="cockpit-panel" style={{
              padding: 16,
              borderLeft: `3px solid ${hex}`,
              opacity: isAcked ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Severity icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                  background: `${hex}18`, border: `1px solid ${hex}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color={hex} style={{
                    animation: alert.severity === 'critical' && !isAcked ? 'phosphorPulse 1.2s ease-in-out infinite' : 'none',
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 14, fontWeight: 700,
                        color: 'var(--text-primary)', letterSpacing: '0.03em',
                      }}>{alert.type}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                        {alert.machineId} — {alert.machineName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <StatusBadge status={alert.severity} />
                      {isAcked ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 10, color: 'var(--status-ok)', fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <CheckCircle size={12} /> ACK{ackName ? ` · ${ackName}` : ''}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAck(alert.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 3,
                            border: '1px solid var(--border-green)',
                            background: 'var(--green-glow)',
                            color: 'var(--green-500)', fontSize: 10,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          <Bell size={11} /> ACKNOWLEDGE
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 3,
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171', fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <X size={11} /> DISMISS
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 6px' }}>
                    {alert.message}
                  </p>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {new Date(alert.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 48, color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          }}>
            <BellOff size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No alerts match the current filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}
