"use client";
import { useEffect, useState } from "react";
import {
  getComplianceReport,
  getDepartmentReport,
  getExpiringReport,
} from "@/lib/api";
import api from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";

export default function ReportsPage() {
  const [compliance, setCompliance] = useState<any[]>([]);
  const [department, setDepartment] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getComplianceReport(),
      getDepartmentReport(),
      getExpiringReport(days),
    ]).then(([c, d, e]) => {
      setCompliance(c.data);
      setDepartment(d.data);
      setExpiring(e.data);
      setLoading(false);
    });
  }, [days]);

  const exportCsv = async (path: string, filename: string) => {
    setExporting(filename);
    try {
      const response = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Reports
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Compliance overview and expiry forecasts
          </p>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Department summary */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>By department</h2>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "5px 12px" }}
                  disabled={!!exporting}
                  onClick={() =>
                    exportCsv(
                      "/api/report/department/export",
                      `department-${today}.csv`,
                    )
                  }
                >
                  {exporting === `department-${today}.csv`
                    ? "Exporting…"
                    : "↓ Export CSV"}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Staff</th>
                      <th>Active</th>
                      <th>Expiring</th>
                      <th>Expired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {department.map((d: any) => (
                      <tr key={d.department}>
                        <td style={{ fontWeight: 500 }}>{d.department}</td>
                        <td>{d.staffCount}</td>
                        <td style={{ color: "var(--success)" }}>{d.active}</td>
                        <td style={{ color: "#b45309" }}>{d.expiring}</td>
                        <td style={{ color: "var(--danger)" }}>{d.expired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expiring forecast */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                  Expiring within
                </h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`btn ${days === d ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "5px 12px", fontSize: 13 }}
                    >
                      {d}d
                    </button>
                  ))}
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 13, padding: "5px 12px" }}
                    disabled={!!exporting}
                    onClick={() =>
                      exportCsv(
                        `/api/report/expiring/export?days=${days}`,
                        `expiring-${days}d-${today}.csv`,
                      )
                    }
                  >
                    {exporting === `expiring-${days}d-${today}.csv`
                      ? "Exporting…"
                      : "↓ Export CSV"}
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff member</th>
                      <th>Department</th>
                      <th>Credential</th>
                      <th>Expiry date</th>
                      <th>Days left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.staffMember}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {c.department}
                        </td>
                        <td>{c.credentialType}</td>
                        <td>{c.expiryDate}</td>
                        <td>
                          <span
                            className={`badge ${c.daysUntilExpiry <= 7 ? "badge-expired" : "badge-expiring"}`}
                          >
                            {c.daysUntilExpiry}d
                          </span>
                        </td>
                      </tr>
                    ))}
                    {expiring.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            color: "var(--text-muted)",
                            textAlign: "center",
                          }}
                        >
                          Nothing expiring in this window.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff compliance scores */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                  Staff compliance scores
                </h2>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "5px 12px" }}
                  disabled={!!exporting}
                  onClick={() =>
                    exportCsv(
                      "/api/report/compliance/export",
                      `compliance-${today}.csv`,
                    )
                  }
                >
                  {exporting === `compliance-${today}.csv`
                    ? "Exporting…"
                    : "↓ Export CSV"}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Total</th>
                      <th>Active</th>
                      <th>Issues</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {s.department}
                        </td>
                        <td>{s.total}</td>
                        <td style={{ color: "var(--success)" }}>{s.active}</td>
                        <td
                          style={{
                            color:
                              s.expired + s.expiring > 0
                                ? "var(--danger)"
                                : "var(--text-muted)",
                          }}
                        >
                          {s.expired + s.expiring}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                background: "var(--surface-2)",
                                borderRadius: 4,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${s.complianceScore}%`,
                                  height: "100%",
                                  borderRadius: 4,
                                  background:
                                    s.complianceScore === 100
                                      ? "var(--success)"
                                      : s.complianceScore >= 70
                                        ? "var(--warning)"
                                        : "var(--danger)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                minWidth: 32,
                              }}
                            >
                              {s.complianceScore}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
