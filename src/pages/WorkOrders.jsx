import { useState } from 'react';
import {
  ClipboardList, Send, AlertCircle, CheckCircle2, RotateCcw,
} from 'lucide-react';
import { machines, faultCodes, technicians } from '../data/mockData';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

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

export default function WorkOrders() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

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

    setSubmitted(prev => [{
      id: `WO-2026-${String(50 + prev.length).padStart(4, '0')}`,
      machineId: form.machineId,
      machineName: machine?.name || form.machineId,
      faultCode: form.faultCode,
      faultDesc: fault?.description || '',
      technician: tech?.name || '',
      priority: form.priority,
      estimatedDowntime: form.estimatedDowntime,
      description: form.description,
      timestamp: new Date().toISOString(),
    }, ...prev]);

    setForm(initialForm);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
  };

  const selectedMachine = machines.find(m => m.id === form.machineId);

  return (
    <div>
      <PageHeader title="Work Order Entry" subtitle="Create maintenance work orders with validated fault assignments" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Form */}
        <div>
          <Card glow>
            <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#4ade80', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                  background: '#0d1117', borderRadius: 6, padding: 10,
                  border: '1px solid #1e293b', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <div style={{ color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 }}>Machine Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: '#94a3b8' }}>
                    <span>Type: <span style={{ color: '#e2e8f0' }}>{selectedMachine.type}</span></span>
                    <span>Location: <span style={{ color: '#e2e8f0' }}>{selectedMachine.location}</span></span>
                    <span>Health: <span style={{ color: selectedMachine.health >= 80 ? '#4ade80' : selectedMachine.health >= 50 ? '#fbbf24' : '#f87171' }}>{selectedMachine.health}%</span></span>
                    <span>Runtime: <span style={{ color: '#e2e8f0' }}>{selectedMachine.runtime}h</span></span>
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

          {/* Success toast */}
          {showSuccess && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 6,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#4ade80', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              animation: 'slideIn 0.3s ease',
            }}>
              <CheckCircle2 size={16} /> Work order created successfully.
            </div>
          )}
        </div>

        {/* Submitted orders */}
        <div>
          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Recently Submitted ({submitted.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 }}>
            {submitted.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 48, color: '#475569',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              }}>
                <ClipboardList size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No work orders submitted this session.</div>
                <div style={{ fontSize: 10, marginTop: 4, color: '#374151' }}>Submitted orders will appear here.</div>
              </div>
            ) : (
              submitted.map(wo => (
                <Card key={wo.id} style={{
                  borderLeft: `3px solid ${wo.priority === 'critical' ? '#ef4444' : wo.priority === 'high' ? '#f59e0b' : '#22c55e'}`,
                  animation: 'slideIn 0.2s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{wo.id}</span>
                    <span style={{
                      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      padding: '2px 6px', borderRadius: 3,
                      background: wo.priority === 'critical' ? '#ef444420' : wo.priority === 'high' ? '#f59e0b20' : '#22c55e20',
                      color: wo.priority === 'critical' ? '#f87171' : wo.priority === 'high' ? '#fbbf24' : '#4ade80',
                      textTransform: 'uppercase',
                    }}>{wo.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 4 }}>{wo.machineId} — {wo.machineName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{wo.faultCode}: {wo.faultDesc}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Technician: {wo.technician} &nbsp;|&nbsp; Est. downtime: {wo.estimatedDowntime}h
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
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 5,
    border: '1px solid #1e293b',
    background: '#0d1117',
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    transition: 'border 0.15s',
  },
  inputError: {
    borderColor: '#ef4444',
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
    color: '#4ade80',
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
    border: '1px solid #1e293b',
    background: 'transparent',
    color: '#64748b',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
