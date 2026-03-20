import { useState } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle, Bell, BellOff, Filter,
} from 'lucide-react';
import { alerts } from '../data/mockData';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

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

export default function Alerts() {
  const [filter, setFilter] = useState('all');
  const [acknowledged, setAcknowledged] = useState(
    Object.fromEntries(alerts.map(a => [a.id, a.acknowledged]))
  );

  const filtered = alerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !acknowledged[a.id];
    return a.severity === filter;
  });

  const handleAck = (id) => {
    setAcknowledged(prev => ({ ...prev, [id]: true }));
  };

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    unack: alerts.filter(a => !acknowledged[a.id]).length,
  };

  return (
    <div>
      <PageHeader title="Active Alerts" subtitle={`${counts.unack} unacknowledged alerts requiring attention`}>
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
