import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Send, AlertCircle, CheckCircle2, RotateCcw,
  XCircle, Wrench, Activity,
} from 'lucide-react';
import { machines, faultCodes, technicians, maintenanceHistory } from '../data/mockData';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'sentinelMaint_workOrders';

const initialForm = {
  machineId: '',
  faultCode: '',
  technicianId: '',
  priority: 'medium',
  estimatedDowntime: '',
  description: '',
};

function validate(form) {
  const errors = {};
  if (!form.machineId) errors.machineId = 'Machine ID is required';
  if (!form.faultCode) errors.faultCode = 'Fault code is required';
  if (!form.technicianId) errors.technicianId = 'Technician must be assigned';
  if (!form.estimatedDowntime) {
    errors.estimatedDowntime = 'Estimated downtime is required';
  } else if (isNaN(Number(form.estimatedDowntime)) || Number(form.estimatedDowntime) <= 0) {
    errors.estimatedDowntime = 'Must be a positive number (hours)';
  }
  if (!form.description || form.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  return errors;
}

function loadSavedOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToDisk(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch { /* quota exceeded — silent */ }
}

// Seed from mockData: grab in-progress entries and normalize shape
function seedFromHistory() {
  return maintenanceHistory
    .filter(h => h.status === 'in-progress')
    .map(h => ({
      id: h.workOrderId,
      machineId: h.machineId,
      machineName: h.machineName,
      faultCode: h.faultCode,
      faultDesc: faultCodes.find(f => f.code === h.faultCode)?.description || '',
      technician: h.technician,
      priority: 'medium',
      estimatedDowntime: h.downtime ?? '—',
      description: h.notes || '',
      status: h.status,
      timestamp: new Date(h.dateOpened).toISOString(),
      source: 'history',
    }));
}

function SelectField({ label, value, onChange, options, error, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={onChange} style={{ ...styles.input, ...(error ? styles.inputError : {}) }}>
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div style={styles.errorText}><AlertCircle size={11} /> {error}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
      />
      {error && <div style={styles.errorText}><AlertCircle size={11} /> {error}</div>}
    </div>
  );
}

const statusColor = {
  open: { bg: '#3b82f620', border: '#3b82f650', text: '#60a5fa' },
  'in-progress': { bg: '#6366f120', border: '#6366f150', text: '#818cf8' },
  completed: { bg: '#22c55e20', border: '#22c55e50', text: '#4ade80' },
  cancelled: { bg: '#ef444420', border: '#ef444450', text: '#f87171' },
};

function WOStatusBadge({ status }) {
  const c = statusColor[status] || statusColor.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4, fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: 0.8,
      color: c.text, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text }} />
      {status}
    </span>
  );
}

function priorityColor(p) {
  if (p === 'critical') return '#ef4444';
  if (p === 'high') return '#f59e0b';
  return '#22c55e';
}

export default function WorkOrders() {
  const { user } = useAuth();

  // Auto-fill technician if logged-in user is a technician
  const userTechId = user?.role === 'technician' ? user.id : '';

  const [form, setForm] = useState({ ...initialForm, technicianId: userTechId });
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  // On mount: merge seeded history orders with localStorage orders
  useEffect(() => {
    const saved = loadSavedOrders();
    const seeded = seedFromHistory();
    // Merge: seeded first (avoid duplicates if user hasn't touched them)
    const savedIds = new Set(saved.map(o => o.id));
    const merged = [
      ...seeded.filter(s => !savedIds.has(s.id)),
      ...saved,
    ];
    setOrders(merged);
  }, []);

  // Persist to localStorage whenever orders change (skip initial empty render)
  const persist = useCallback((next) => {
    setOrders(next);
    saveToDisk(next);
  }, []);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const machine = machines.find(m => m.id === form.machineId);
    const tech = technicians.find(t => t.id === form.technicianId);
    const fault = faultCodes.find(f => f.code === form.faultCode);

    const newOrder = {
      id: `WO-2026-${String(50 + orders.length).padStart(4, '0')}`,
      machineId: form.machineId,
      machineName: machine?.name || form.machineId,
      faultCode: form.faultCode,
      faultDesc: fault?.description || '',
      technician: tech?.name || '',
      priority: form.priority,
      estimatedDowntime: form.estimatedDowntime,
      description: form.description,
      status: 'open',
      timestamp: new Date().toISOString(),
      source: 'user',
      createdBy: user?.name || 'Unknown',
    };

    persist([newOrder, ...orders]);
    setForm({ ...initialForm, technicianId: userTechId });
    setToast('Work order created successfully.');
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancel = (id) => {
    persist(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
  };

  const handleReset = () => {
    setForm({ ...initialForm, technicianId: userTechId });
    setErrors({});
  };

  const selectedMachine = machines.find(m => m.id === form.machineId);

  // Partition orders
  const activeOrders = orders.filter(o => o.status === 'open' || o.status === 'in-progress');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  // Also pull completed from maintenanceHistory that aren't already tracked
  const trackedIds = new Set(orders.map(o => o.id));
  const extraHistory = maintenanceHistory
    .filter(h => h.status === 'completed' && !trackedIds.has(h.workOrderId))
    .map(h => ({
      id: h.workOrderId,
      machineId: h.machineId,
      machineName: h.machineName,
      faultCode: h.faultCode,
      faultDesc: faultCodes.find(f => f.code === h.faultCode)?.description || '',
      technician: h.technician,
      priority: 'medium',
      estimatedDowntime: h.downtime ?? '—',
      description: h.notes || '',
      status: h.status,
      timestamp: new Date(h.dateOpened).toISOString(),
      source: 'history',
    }));
  const allHistory = [...historyOrders, ...extraHistory];

  // Machines with active work orders
  const activeMachineIds = [...new Set(activeOrders.map(o => o.machineId))];
  const connectedMachines = machines.filter(m => activeMachineIds.includes(m.id));

  return (
    <div>
      <PageHeader title="Work Order Entry" subtitle="Create and manage maintenance work orders" />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '10px 18px', borderRadius: 6,
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--green-500)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease',
        }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Active work orders — prominent at top */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--green-500)',
          marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Activity size={14} /> Active Work Orders ({activeOrders.length})
        </div>

        {activeOrders.length === 0 ? (
          <Card>
            <div style={{
              textAlign: 'center', padding: 20, color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            }}>
              No active work orders.
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 10,
          }}>
            {activeOrders.map(wo => (
              <Card key={wo.id} style={{
                borderLeft: `3px solid ${priorityColor(wo.priority)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--green-500)' }}>
                    {wo.id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WOStatusBadge status={wo.status} />
                    <span style={{
                      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      padding: '2px 6px', borderRadius: 3,
                      background: `${priorityColor(wo.priority)}20`,
                      color: priorityColor(wo.priority),
                      textTransform: 'uppercase',
                    }}>{wo.priority}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {wo.machineId} — {wo.machineName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {wo.faultCode}: {wo.faultDesc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Technician: {wo.technician} &nbsp;|&nbsp; Est. downtime: {wo.estimatedDowntime}h
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>
                  {wo.description.length > 120 ? wo.description.slice(0, 120) + '...' : wo.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleCancel(wo.id)}
                    style={styles.btnCancel}
                  >
                    <XCircle size={12} /> Cancel
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connected machines strip */}
      {connectedMachines.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
            marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            <Wrench size={11} style={{ verticalAlign: -2, marginRight: 4 }} />
            Machines with Active Work Orders
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {connectedMachines.map(m => (
              <div key={m.id} style={{
                padding: '6px 12px', borderRadius: 6,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: 'var(--text-primary)' }}>{m.id}</span>
                <span style={{ color: 'var(--text-muted)' }}>{m.name}</span>
                <StatusBadge status={m.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Form (left) + History (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Form — always visible */}
        <div>
          <Card glow>
            <div style={{
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--green-500)',
              marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1,
            }}>
              <ClipboardList size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              New Work Order
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <SelectField
                  label="Machine ID *"
                  value={form.machineId}
                  onChange={set('machineId')}
                  error={errors.machineId}
                  placeholder="Select machine..."
                  options={machines.map(m => ({ value: m.id, label: `${m.id} — ${m.name}` }))}
                />
                <SelectField
                  label="Fault Code *"
                  value={form.faultCode}
                  onChange={set('faultCode')}
                  error={errors.faultCode}
                  placeholder="Select fault..."
                  options={faultCodes.map(f => ({ value: f.code, label: `${f.code} — ${f.description}` }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <SelectField
                  label="Assign Technician *"
                  value={form.technicianId}
                  onChange={set('technicianId')}
                  error={errors.technicianId}
                  placeholder="Select technician..."
                  options={technicians.map(t => ({ value: t.id, label: `${t.name} (${t.specialty})` }))}
                />
                <SelectField
                  label="Priority"
                  value={form.priority}
                  onChange={set('priority')}
                  placeholder=""
                  options={[
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              <InputField
                label="Estimated Downtime (hours) *"
                value={form.estimatedDowntime}
                onChange={set('estimatedDowntime')}
                error={errors.estimatedDowntime}
                placeholder="e.g. 4"
                type="number"
              />

              <div>
                <label style={styles.label}>Description *</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Describe the issue, observations, and required actions..."
                  rows={4}
                  style={{
                    ...styles.input,
                    resize: 'vertical',
                    minHeight: 80,
                    ...(errors.description ? styles.inputError : {}),
                  }}
                />
                {errors.description && <div style={styles.errorText}><AlertCircle size={11} /> {errors.description}</div>}
              </div>

              {/* Machine preview */}
              {selectedMachine && (
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 6, padding: 10,
                  border: '1px solid var(--border-primary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 }}>Machine Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: 'var(--text-secondary)' }}>
                    <span>Type: <span style={{ color: 'var(--text-primary)' }}>{selectedMachine.type}</span></span>
                    <span>Location: <span style={{ color: 'var(--text-primary)' }}>{selectedMachine.location}</span></span>
                    <span>Health: <span style={{ color: selectedMachine.health >= 80 ? '#4ade80' : selectedMachine.health >= 50 ? '#fbbf24' : '#f87171' }}>{selectedMachine.health}%</span></span>
                    <span>Runtime: <span style={{ color: 'var(--text-primary)' }}>{selectedMachine.runtime}h</span></span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={handleReset} style={styles.btnSecondary}>
                  <RotateCcw size={13} /> Reset
                </button>
                <button onClick={handleSubmit} style={styles.btnPrimary}>
                  <Send size={13} /> Submit Work Order
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Work Order History */}
        <div>
          <div style={{
            fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
            marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Work Order History ({allHistory.length})
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4,
          }}>
            {allHistory.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 48, color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              }}>
                <ClipboardList size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No completed or cancelled work orders.</div>
              </div>
            ) : (
              allHistory.map(wo => (
                <Card key={wo.id} style={{
                  borderLeft: `3px solid ${wo.status === 'cancelled' ? '#ef4444' : '#22c55e'}`,
                  opacity: wo.status === 'cancelled' ? 0.7 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {wo.id}
                    </span>
                    <WOStatusBadge status={wo.status} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {wo.machineId} — {wo.machineName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {wo.faultCode}: {wo.faultDesc}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Technician: {wo.technician}
                    {wo.estimatedDowntime && wo.estimatedDowntime !== '—'
                      ? ` | Downtime: ${wo.estimatedDowntime}h`
                      : ''}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 5,
    border: '1px solid var(--border-primary)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    transition: 'border 0.15s',
  },
  inputError: {
    border: '1px solid #ef4444',
    boxShadow: '0 0 0 1px rgba(239,68,68,0.2)',
  },
  errorText: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    color: '#f87171',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 4,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid rgba(34,197,94,0.4)',
    background: 'rgba(34,197,94,0.15)',
    color: 'var(--green-500)',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid var(--border-primary)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnCancel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 5,
    border: '1px solid rgba(239,68,68,0.4)',
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};
