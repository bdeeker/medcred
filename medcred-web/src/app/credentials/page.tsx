"use client";
import { useEffect, useState, Suspense } from "react";
import {
  getCredentials,
  getCredentialTypes,
  getStaff,
  createCredential,
} from "@/lib/api";
import api from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import { Credential, CredentialType, StaffMember } from "@/types";
import { useSearchParams } from "next/navigation";

function CredentialsContent() {
  const searchParams = useSearchParams();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filter, setFilter] = useState(searchParams.get("status") ?? "");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    staffMemberId: "",
    credentialTypeId: "",
    issuedDate: "",
    expiryDate: "",
    fileUrl: "",
  });

  const load = () =>
    getCredentials(filter || undefined).then((r) => {
      setCredentials(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, [filter]);
  useEffect(() => {
    getCredentialTypes().then((r) => setTypes(r.data));
    getStaff().then((r) => setStaff(r.data));
  }, []);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await api.post("/api/credential/upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      await fetch(data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setForm((f) => ({ ...f, fileUrl: data.fileUrl }));
    } catch {
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await createCredential(form);
    setShowForm(false);
    setSaving(false);
    setForm({
      staffMemberId: "",
      credentialTypeId: "",
      issuedDate: "",
      expiryDate: "",
      fileUrl: "",
    });
    load();
  };

  const statusColor: Record<string, string> = {
    Active: "badge-active",
    Expiring: "badge-expiring",
    Expired: "badge-expired",
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Credentials
            </h1>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {["", "Active", "Expiring", "Expired"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "5px 14px", fontSize: 13 }}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + Add credential
          </button>
        </div>

        {showForm && (
          <div className="card fade-up" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              New credential
            </h3>
            <form
              onSubmit={submit}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label>Staff member</label>
                <select
                  className="input"
                  value={form.staffMemberId}
                  onChange={set("staffMemberId")}
                  required
                >
                  <option value="">Select…</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Credential type</label>
                <select
                  className="input"
                  value={form.credentialTypeId}
                  onChange={set("credentialTypeId")}
                  required
                >
                  <option value="">Select…</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Issued date</label>
                <input
                  className="input"
                  type="date"
                  value={form.issuedDate}
                  onChange={set("issuedDate")}
                  required
                />
              </div>
              <div>
                <label>Expiry date</label>
                <input
                  className="input"
                  type="date"
                  value={form.expiryDate}
                  onChange={set("expiryDate")}
                  required
                />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label>Document (PDF, JPG, PNG — max 10MB)</label>
                <input
                  className="input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Uploading…
                  </p>
                )}
                {form.fileUrl && !uploading && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--success)",
                      marginTop: 4,
                    }}
                  >
                    ✓ Document uploaded
                  </p>
                )}
              </div>
              <div
                style={{
                  gridColumn: "1/-1",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setForm({
                      staffMemberId: "",
                      credentialTypeId: "",
                      issuedDate: "",
                      expiryDate: "",
                      fileUrl: "",
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || uploading}
                >
                  {saving ? "Saving…" : "Add credential"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff member</th>
                    <th>Credential type</th>
                    <th>Issued</th>
                    <th>Expires</th>
                    <th>Days left</th>
                    <th>Status</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.staffMember}</td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {c.credentialType}
                      </td>
                      <td>{c.issuedDate}</td>
                      <td>{c.expiryDate}</td>
                      <td
                        style={{
                          color:
                            c.daysUntilExpiry < 0
                              ? "var(--danger)"
                              : c.daysUntilExpiry <= 30
                                ? "var(--warning)"
                                : "inherit",
                        }}
                      >
                        {c.daysUntilExpiry < 0
                          ? `${Math.abs(c.daysUntilExpiry)}d ago`
                          : `${c.daysUntilExpiry}d`}
                      </td>
                      <td>
                        <span className={`badge ${statusColor[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.fileUrl ? (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 13,
                              color: "var(--accent)",
                              textDecoration: "none",
                            }}
                          >
                            View doc
                          </a>
                        ) : (
                          <span
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            —
                          </span>
                        )}
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

export default function CredentialsPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <CredentialsContent />
    </Suspense>
  );
}
