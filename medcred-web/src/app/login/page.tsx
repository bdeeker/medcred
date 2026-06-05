'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { login as apiLogin, register as apiRegister } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ orgName: '', email: '', password: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiLogin(form.email, form.password);
        login(res.data);
      } else {
        await apiRegister(form.orgName, form.email, form.password);
        const res = await apiLogin(form.email, form.password);
        login(res.data);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 40px',
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            Med<span style={{ color: 'var(--accent)' }}>Cred</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {mode === 'login' ? 'Sign in to your organization' : 'Create your organization'}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label>Organization name</label>
              <input className="input" placeholder="City General Hospital" value={form.orgName} onChange={set('orgName')} required />
            </div>
          )}
          <div>
            <label>Email address</label>
            <input className="input" type="email" placeholder="admin@hospital.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
