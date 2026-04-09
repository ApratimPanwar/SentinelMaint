import { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle, Bell, BellOff, Plus, X,
} from 'lucide-react';
import { alerts as mockAlerts, machines } from '../data/mockData';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

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
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid #1e293b',
  background: '#0d1117',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 11,
  color: '#94a3b8',
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: 4,
  display: 'block',
};

export default function Alerts() {
  const [filter, setFilter] = useState('all');

  const [dismissed, setDismissed] = useState(() =>
    loadJson(LS_KEYS.dismissed, [])
  );

  const [acknowledged, setAcknowledged] = useState(() => {
    const saved = loadJson(LS_KEYS.acknowledged, null);
    if (saved) return saved;
    return Object.fromEntries(mockAlerts.map(a => [a.id, a.acknowledged]));
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

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem(LS_KEYS.dismissed, JSON.stringify(dismissed));
  }, [dismissed]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.acknowledged, JSON.stringify(acknowledged));
  }, [acknowledged]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.manual, JSON.stringify(manualAlerts));
  }, [manualAlerts]);

  // Combine mock + manual alerts, exclude dismissed
  const allAlerts = [...mockAlerts, ...manualAlerts].filter(
    a => !dismissed.includes(a.id)
  );

  const filtered = allAlerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !acknowledged[a.id];
    return a.severity === filter;
  });

  const handleAck = (id) => {
    setAcknowledged(prev => ({ ...prev, [id]: true }));
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

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    warning: allAlerts.filter(a => a.severity === 'warning').length,
    info: allAlerts.filter(a => a.severity === 'info').length,
    unack: allAlerts.filter(a => !acknowledged[a.id]).length,
  };

  return (
    <div>
      <PageHeader title="Active Alerts" subtitle={`${counts.unack} unacknowledged alerts requiring attention`}>
        <button
          onClick={() => setShowForm(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 6,
            border: '1px solid rgba(34,197,94,0.3)',
            background: 'rgba(34,197,94,0.1)',
            color: '#4ade80', fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={13} /> ADD ALERT
        </button>
        <div style={{
          display: 'flex', gap: 4, background: '#0d1117', borderRadius: 6,
          border: '1px solid #1e293b', padding: 3,
        }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'critical', label: `Critical (${counts.critical})` },
            { key: 'warning', label: `Warning (${counts.warning})` },
            { key: 'unacknowledged', label: `Unacked (${counts.unack})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                border: 'none',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                cursor: 'pointer',
                background: filter === f.key ? 'rgba(34,197,94,0.15)' : 'transparent',
                color: filter === f.key ? '#4ade80' : '#64748b',
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
        <Card style={{ marginBottom: 12, borderLeft: '3px solid #4ade80' }}>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Create Manual Alert
              </span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: 'pointer', padding: 2,
                }}
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
                border: '1px solid rgba(34,197,94,0.4)',
                background: 'rgba(34,197,94,0.15)',
                color: '#4ade80', fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              SUBMIT ALERT
            </button>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: 4 }}>
        {filtered.map(alert => {
          const Icon = severityIcon[alert.severity] || Info;
          const color = severityColor[alert.severity];
          const isAcked = acknowledged[alert.id];

          return (
            <Card key={alert.id} style={{
              borderLeft: `3px solid ${color}`,
              opacity: isAcked ? 0.6 : 1,
              animation: 'slideIn 0.2s ease',
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `${color}15`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} style={{
                    animation: alert.severity === 'critical' && !isAcked ? 'blink 1.2s ease-in-out infinite' : 'none',
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.type}</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                        {alert.machineId} — {alert.machineName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={alert.severity} />
                      {isAcked ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 10, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <CheckCircle size={12} /> ACK
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAck(alert.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4,
                            border: '1px solid rgba(34,197,94,0.3)',
                            background: 'rgba(34,197,94,0.1)',
                            color: '#4ade80', fontSize: 10,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Bell size={11} /> ACKNOWLEDGE
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 4,
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#f87171', fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <X size={11} /> DISMISS
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{alert.message}</p>
                  <div style={{
                    fontSize: 10, color: '#475569', fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 6,
                  }}>
                    {new Date(alert.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 48, color: '#475569',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          }}>
            <BellOff size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No alerts match the current filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}
