"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/staff", label: "Staff", icon: "◈" },
  { href: "/credentials", label: "Credentials", icon: "◉" },
  { href: "/reports", label: "Reports", icon: "◫" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "var(--sidebar-width)",
        background: "var(--text)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Med<span style={{ color: "var(--accent)" }}>Cred</span>
        </div>
        <div
          style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}
        >
          {user?.email}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          Signed in as {user?.role}
        </div>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          ⎋ Sign out
        </button>
      </div>
    </aside>
  );
}
