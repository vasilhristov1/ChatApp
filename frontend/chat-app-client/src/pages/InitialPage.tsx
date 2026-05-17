import { Link } from "react-router-dom";

export default function InitialPage() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/" style={styles.brand}>
          <img src="/logo.png" alt="ChatApp" style={styles.logo} />
          <span>ChatApp</span>
        </Link>

        <nav style={styles.nav}>
          <Link to="/login" style={styles.signIn}>
            Sign in
          </Link>

          <Link to="/register" style={styles.getStarted}>
            Get Started
          </Link>
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.badge}>✦ The next generation of chat</div>

        <h1 style={styles.title}>
          Communication that feels <span>alive.</span>
        </h1>

        <p style={styles.subtitle}>
          A beautifully crafted chat experience for friends, teams, and
          communities. Fast, modern, secure, and designed for real connection.
        </p>

        <div style={styles.actions}>
          <Link to="/register" style={styles.primaryButton}>
            Start chatting →
          </Link>

          <Link to="/login" style={styles.secondaryButton}>
            I already have an account
          </Link>
        </div>

        <section style={styles.preview}>
          <aside style={styles.previewSidebar}>
            <div style={styles.sidebarPill} />
            <div style={styles.fakeUser} />
            <div style={styles.fakeUser} />
            <div style={styles.fakeUser} />
            <div style={styles.fakeUser} />
          </aside>

          <div style={styles.previewChat}>
            <div style={styles.messageLeft}>
              Hey! How is the new design coming along?
            </div>

            <div style={styles.messageRight}>
              Just wrapped up the final polish. The experience feels incredible.
            </div>

            <div style={styles.fakeInput}>
              <span>Type a message...</span>
              <div />
            </div>
          </div>
        </section>

        <section style={styles.features}>
          <div style={styles.featureCard}>
            <div style={styles.icon}>⚡</div>
            <h3>Lightning Fast</h3>
            <p>Real-time messaging with a smooth and responsive experience.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>🛡️</div>
            <h3>Secure & Private</h3>
            <p>Built with authentication, privacy, and safe communication in mind.</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>💬</div>
            <h3>Chat & Video</h3>
            <p>Text, files, images, and video calls in one beautiful place.</p>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>© 2026 ChatApp. Built for connection.</footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(124, 58, 237, 0.18), transparent 35%), #08090d",
    color: "white",
  },
  header: {
    height: 72,
    padding: "0 40px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "white",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 20,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    objectFit: "contain",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  signIn: {
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
  },
  getStarted: {
    color: "white",
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    padding: "10px 18px",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 10px 30px rgba(124,58,237,0.35)",
  },
  main: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "72px 24px 80px",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: 999,
    color: "#a78bfa",
    background: "rgba(124,58,237,0.12)",
    border: "1px solid rgba(167,139,250,0.3)",
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 28,
  },
  title: {
    maxWidth: 880,
    margin: "0 auto",
    fontSize: "clamp(46px, 7vw, 78px)",
    lineHeight: 1.05,
    letterSpacing: "-0.05em",
    fontWeight: 900,
  },
  subtitle: {
    maxWidth: 680,
    margin: "28px auto 0",
    color: "#a1a1aa",
    fontSize: 20,
    lineHeight: 1.7,
  },
  actions: {
    marginTop: 36,
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    color: "white",
    padding: "14px 26px",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 800,
    boxShadow: "0 18px 40px rgba(124,58,237,0.35)",
  },
  secondaryButton: {
    color: "#d4d4d8",
    padding: "14px 20px",
    textDecoration: "none",
    fontWeight: 700,
  },
  preview: {
    marginTop: 90,
    height: 420,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.025)",
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
    textAlign: "left",
  },
  previewSidebar: {
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: 24,
  },
  sidebarPill: {
    width: 90,
    height: 28,
    borderRadius: 10,
    background: "#2e1b62",
    marginBottom: 30,
  },
  fakeUser: {
    width: 140,
    height: 34,
    borderRadius: 999,
    background: "linear-gradient(90deg, #27272a, #18181b)",
    marginBottom: 18,
  },
  previewChat: {
    padding: 40,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: 20,
  },
  messageLeft: {
    maxWidth: 620,
    background: "#232329",
    color: "#d4d4d8",
    padding: "18px 22px",
    borderRadius: 16,
  },
  messageRight: {
    alignSelf: "flex-end",
    maxWidth: 620,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    color: "white",
    padding: "18px 22px",
    borderRadius: 16,
  },
  fakeInput: {
    height: 52,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    color: "#71717a",
  },
  features: {
    marginTop: 90,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 28,
    textAlign: "left",
  },
  featureCard: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 28,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(124,58,237,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  footer: {
    textAlign: "center",
    color: "#71717a",
    padding: "30px 20px",
  },
};