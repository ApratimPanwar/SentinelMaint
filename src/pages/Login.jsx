import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX feel
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0a0e14)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      padding: 16,
    }}>
      {/* Background glow effect */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg-card, #111820)',
        border: '1px solid var(--border-primary, #1e293b)',
        borderRadius: 12,
        padding: 40,
        boxShadow: '0 0 40px rgba(34,197,94,0.06), 0 0 80px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo / Branding */}
        <div style={{
          textAlign: 'center',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            marginBottom: 16,
          }}>
            <Shield size={28} color="var(--green-400, #4ade80)" />
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--green-400, #4ade80)',
            letterSpacing: 3,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            SENTINEL
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted, #64748b)',
            letterSpacing: 2,
            marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            MAINT v2.4
          </div>
        </div>

        {/* System Access heading */}
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <div style={{
              height: 1,
              width: 40,
              background: 'linear-gradient(to right, transparent, var(--border-primary, #1e293b))',
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary, #94a3b8)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              System Access
            </span>
            <div style={{
              height: 1,
              width: 40,
              background: 'linear-gradient(to left, transparent, var(--border-primary, #1e293b))',
            }} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 6,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            marginBottom: 20,
          }}>
            <AlertCircle size={14} color="#f87171" />
            <span style={{
              fontSize: 12,
              color: '#f87171',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {error}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="var(--text-muted, #64748b)" style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@sentinel.io"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'var(--bg-secondary, #0d1117)',
                  border: '1px solid var(--border-primary, #1e293b)',
                  borderRadius: 6,
                  color: 'var(--text-primary, #e2e8f0)',
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--green-500, #22c55e)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-primary, #1e293b)'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color="var(--text-muted, #64748b)" style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: 'var(--bg-secondary, #0d1117)',
                  border: '1px solid var(--border-primary, #1e293b)',
                  borderRadius: 6,
                  color: 'var(--text-primary, #e2e8f0)',
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--green-500, #22c55e)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-primary, #1e293b)'}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: loading
                ? 'rgba(34,197,94,0.15)'
                : 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))',
              border: '1px solid var(--green-500, #22c55e)',
              borderRadius: 6,
              color: 'var(--green-400, #4ade80)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: '0 0 15px rgba(34,197,94,0.1)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(34,197,94,0.25)';
                e.target.style.boxShadow = '0 0 25px rgba(34,197,94,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))';
                e.target.style.boxShadow = '0 0 15px rgba(34,197,94,0.1)';
              }
            }}
          >
            <LogIn size={14} />
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24,
          padding: '12px 14px',
          borderRadius: 6,
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.1)',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--green-400, #4ade80)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Demo Credentials
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted, #64748b)',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
          }}>
            Demo: any technician email + 'demo'
            <br />
            admin@sentinel.io + 'admin'
          </div>
        </div>

        {/* Footer text */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 10,
          color: 'var(--text-muted, #64748b)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 0.5,
        }}>
          Predictive Maintenance Console — Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}
