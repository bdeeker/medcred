'use client';
import { useEffect, useState } from 'react';
import { getStaff, createStaff } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { StaffMember } from '@/types';
import Link from 'next/link';

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', department: '', licenseNumber: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getStaff().then(r => { setStaff(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await createStaff(form);
    setForm({ firstName: '', lastName: '', department: '', licenseNumber: '' });
    setShowForm(false); setSaving(false);
    load();
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Staff</h1>
            <p style={{ color: 'var(--text-muted)' }}>{staff.length} members</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Add staff
          </button>
        </div>

        {showForm && (
          <div className="card fade-up" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New staff member</h3>
            <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label>First name</label><input className="input" value={form.firstName} onChange={set('firstName')} required /></div>
              <div><label>Last name</label><input className="input" value={form.lastName} onChange={set('lastName')} required /></div>
              <div><label>Department</label><input className="input" value={form.department} onChange={set('department')} required /></div>
              <div><label>License number</label><input className="input" value={form.licenseNumber} onChange={set('licenseNumber')} required /></div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add member'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>License</th>
                    <th>Credentials</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.department}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.licenseNumber}</td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          {s.credentialCount} total
                          {s.expiredCount > 0 && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>· {s.expiredCount} expired</span>}
                          {s.expiringCount > 0 && <span style={{ color: 'var(--warning)', marginLeft: 6 }}>· {s.expiringCount} expiring</span>}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-active' : 'badge-expired'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/staff/${s.id}`} style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
