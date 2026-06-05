"use client";
import { useEffect, useState } from "react";
import { getDashboard, getDepartmentReport } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardData } from "@/types";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Active: "#16a34a",
  Expiring: "#f59e0b",
  Expired: "#e53935",
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      Promise.all([getDashboard(), getDepartmentReport()]).then(([d, dept]) => {
        setData(d.data);
        setDeptData(dept.data);
        setDataLoading(false);
      });
    }
  }, [user]);

  if (isLoading) return null;

  const get = (status: string) =>
    data?.summary.find((s) => s.status === status)?.count ?? 0;

  const total = (data?.summary ?? []).reduce((a, b) => a + b.count, 0);

  const pieData = (data?.summary ?? []).map((s) => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="main-content fade-up">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Credential status across your organization
          </p>
        </div>

        {dataLoading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stat-grid">
              {[
                {
                  label: "Total credentials",
                  value: total,
                  color: "var(--text)",
                },
                {
                  label: "Active",
                  value: get("Active"),
                  color: "var(--success)",
                },
                {
                  label: "Expiring soon",
                  value: get("Expiring"),
                  color: "var(--warning)",
                },
                {
                  label: "Expired",
                  value: get("Expired"),
                  color: "var(--danger)",
                },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Donut chart */}
              <div
                className="card"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                  Status breakdown
                </h2>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div>
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={STATUS_COLORS[entry.name] ?? "#ccc"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {pieData.map((d) => (
                        <div
                          key={d.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: STATUS_COLORS[d.name],
                            }}
                          />
                          <span style={{ color: "var(--text-muted)" }}>
                            {d.name}
                          </span>
                          <span style={{ fontWeight: 600, marginLeft: "auto" }}>
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Department bar chart */}
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                  Credentials by department
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={deptData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="active"
                      name="Active"
                      fill="#16a34a"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="expiring"
                      name="Expiring"
                      fill="#f59e0b"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="expired"
                      name="Expired"
                      fill="#e53935"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expiring soon table */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>Expiring soon</h2>
                <Link
                  href="/credentials?status=Expiring"
                  style={{
                    fontSize: 13,
                    color: "var(--accent)",
                    textDecoration: "none",
                  }}
                >
                  View all →
                </Link>
              </div>

              {data?.expiringSoon.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  No credentials expiring soon. 🎉
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Staff member</th>
                        <th>Credential</th>
                        <th>Expiry date</th>
                        <th>Days left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.expiringSoon.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 500 }}>{c.staffMember}</td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {c.credentialType}
                          </td>
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
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
