"use client";
import { useEffect, useState, use } from "react";
import { getStaffById } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading]);

  useEffect(() => {
    if (user && id) {
      getStaffById(id).then((r) => {
        setStaff(r.data);
        setLoading(false);
      });
    }
  }, [user, id]);

  if (isLoading || loading) return null;
  if (!staff) return <div>Staff member not found.</div>;

  const statusColor: Record<string, string> = {
    Active: "badge-active",
    Expiring: "badge-expiring",
    Expired: "badge-expired",
  };

  const active =
    staff.credentials?.filter((c: any) => c.status === "Active").length ?? 0;
  const expiring =
    staff.credentials?.filter((c: any) => c.status === "Expiring").length ?? 0;
  const expired =
    staff.credentials?.filter((c: any) => c.status === "Expired").length ?? 0;
  const total = staff.credentials?.length ?? 0;
  const score = total === 0 ? 100 : Math.round((active / total) * 100);

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/staff"
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← Back to staff
          </Link>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: 12,
            }}
          >
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {staff.firstName} {staff.lastName}
              </h1>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                {staff.department} · {staff.licenseNumber}
              </div>
            </div>
            <span
              className={`badge ${staff.isActive ? "badge-active" : "badge-expired"}`}
            >
              {staff.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            {
              label: "Compliance score",
              value: `${score}%`,
              color:
                score === 100
                  ? "var(--success)"
                  : score >= 70
                    ? "var(--warning)"
                    : "var(--danger)",
            },
            { label: "Total credentials", value: total, color: "var(--text)" },
            { label: "Active", value: active, color: "var(--success)" },
            { label: "Expiring", value: expiring, color: "var(--warning)" },
            { label: "Expired", value: expired, color: "var(--danger)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Credentials</h2>
            <Link
              href="/credentials"
              style={{
                fontSize: 13,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              + Add credential
            </Link>
          </div>

          {staff.credentials?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No credentials on file.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Credential type</th>
                    <th>Issued</th>
                    <th>Expires</th>
                    <th>Days left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.credentials?.map((c: any) => {
                    const days = Math.round(
                      (new Date(c.expiryDate).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>
                          {c.credentialType?.name ?? c.credentialType}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {c.issuedDate}
                        </td>
                        <td>{c.expiryDate}</td>
                        <td
                          style={{
                            color:
                              days < 0
                                ? "var(--danger)"
                                : days <= 30
                                  ? "var(--warning)"
                                  : "inherit",
                          }}
                        >
                          {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                        </td>
                        <td>
                          <span className={`badge ${statusColor[c.status]}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
