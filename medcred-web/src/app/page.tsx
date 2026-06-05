"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1923",
        color: "#fff",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Med<span style={{ color: "#4d8eff" }}>Cred</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            style={{
              background: "#0057ff",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 48px 60px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(0,87,255,0.12)",
            color: "#4d8eff",
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 28,
            border: "1px solid rgba(0,87,255,0.25)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Healthcare credential management
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Never let a staff credential
          <br />
          <span style={{ color: "#4d8eff" }}>expire unnoticed</span> again
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 17,
            maxWidth: 480,
            margin: "0 auto 36px",
            lineHeight: 1.7,
          }}
        >
          MedCred tracks every license, certification, and background check
          across your clinical staff — and alerts you before they expire.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              background: "#0057ff",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Start free →
          </Link>
          <Link
            href="/dashboard"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 15,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            View demo
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          background: "rgba(255,255,255,0.03)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "36px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 64,
            flexWrap: "wrap",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {[
            { value: "100%", label: "Audit trail coverage" },
            { value: "< 5 min", label: "Setup time" },
            { value: "60 days", label: "Advance expiry alerts" },
            { value: "HIPAA", label: "Compliant architecture" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#4d8eff",
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{ padding: "72px 48px", maxWidth: 1000, margin: "0 auto" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Everything your compliance team needs
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              icon: "◉",
              title: "Credential tracking",
              desc: "Track RN licenses, BLS/ACLS certifications, background checks, and any custom credential type your organization requires.",
            },
            {
              icon: "◈",
              title: "Automated alerts",
              desc: "Email notifications go out automatically at 90, 60, and 30 days before expiry — so nothing slips through the cracks.",
            },
            {
              icon: "◫",
              title: "Compliance reports",
              desc: "Generate department-level compliance scores instantly. Export to CSV for accreditation audits and board reviews.",
            },
            {
              icon: "▦",
              title: "Audit log",
              desc: "Every credential update is logged with timestamp and user — giving you a complete chain of custody for regulators.",
            },
            {
              icon: "⬡",
              title: "Document storage",
              desc: "Attach license certificates and background check documents directly to credentials. Stored securely on AWS S3.",
            },
            {
              icon: "◭",
              title: "Multi-department",
              desc: "Organize staff by department and get a clear view of compliance status across your entire organization at once.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "24px 20px",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 12, color: "#4d8eff" }}>
                {f.icon}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "72px 48px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,87,255,0.04)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          Ready to stay compliant?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 15,
            marginBottom: 28,
          }}
        >
          Set up your organization in minutes. No credit card required.
        </p>
        <Link
          href="/login"
          style={{
            background: "#0057ff",
            color: "#fff",
            padding: "14px 36px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          Med<span style={{ color: "#4d8eff" }}>Cred</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          Powered by AWS Aurora PostgreSQL + Vercel
        </div>
      </footer>
    </div>
  );
}
