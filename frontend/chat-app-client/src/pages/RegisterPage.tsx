import { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError("");
        setIsSubmitting(true);

        try {
            const authResponse = await authApi.register({
                username,
                email,
                password,
            });

            localStorage.setItem("accessToken", authResponse.accessToken);
            localStorage.setItem("refreshToken", authResponse.refreshToken);

            const currentUser = await authApi.me();

            setAuth(
                authResponse.accessToken,
                authResponse.refreshToken,
                currentUser
            );

            navigate("/chat");
        } catch {
            setError("Registration failed. Check your data and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <Link to="/" style={styles.backButton}>
                ← Back
            </Link>

            <form onSubmit={handleSubmit} style={styles.card}>
                <h1 style={styles.title}>Create an account</h1>

                <p style={styles.subtitle}>Join the conversation today</p>

                {error && <p style={styles.error}>{error}</p>}

                <label style={styles.label}>
                    Username
                    <input
                        placeholder="Alice Freeman"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                    />
                </label>

                <label style={styles.label}>
                    Email
                    <input
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                    />
                </label>

                <label style={styles.label}>
                    Password
                    <input
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                </label>

                <button disabled={isSubmitting} style={styles.button}>
                    {isSubmitting ? "Creating account..." : "Sign Up"}
                </button>

                <p style={styles.footerText}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background:
            "radial-gradient(circle at top, rgba(124,58,237,0.14), transparent 34%), #08090d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
    },
    backButton: {
        position: "absolute",
        top: 24,
        left: 24,
        color: "#d4d4d8",
        textDecoration: "none",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        padding: "10px 14px",
        borderRadius: 999,
    },
    card: {
        width: "100%",
        maxWidth: 860,
        padding: "64px 56px",
        background: "rgba(15, 15, 20, 0.86)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 28,
        boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
    },
    title: {
        margin: 0,
        color: "white",
        textAlign: "center",
        fontSize: "clamp(38px, 6vw, 56px)",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        fontWeight: 900,
    },
    subtitle: {
        margin: "0 0 36px",
        color: "#a1a1aa",
        textAlign: "center",
        fontSize: "clamp(22px, 3vw, 30px)",
    },
    label: {
        color: "white",
        fontWeight: 800,
        fontSize: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    input: {
        height: 64,
        padding: "0 22px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "#090a0f",
        color: "white",
        fontSize: 22,
        outline: "none",
    },
    button: {
        height: 66,
        marginTop: 12,
        borderRadius: 16,
        border: "none",
        background: "linear-gradient(135deg, #7c3aed, #6366f1)",
        color: "white",
        cursor: "pointer",
        fontSize: 24,
        fontWeight: 800,
        boxShadow: "0 18px 40px rgba(124,58,237,0.35)",
    },
    footerText: {
        margin: "28px 0 0",
        textAlign: "center",
        color: "#a1a1aa",
        fontSize: 22,
    },
    link: {
        color: "#8b5cf6",
        textDecoration: "none",
        fontWeight: 700,
    },
    error: {
        margin: 0,
        color: "#fecaca",
        background: "rgba(220,38,38,0.16)",
        border: "1px solid rgba(248,113,113,0.3)",
        padding: "12px 14px",
        borderRadius: 12,
        textAlign: "center",
    },
};