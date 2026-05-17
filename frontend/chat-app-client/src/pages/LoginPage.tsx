import { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError("");
        setIsSubmitting(true);

        try {
            const authResponse = await authApi.login({
                emailOrUsername,
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

            navigate("/");
        } catch {
            setError("Invalid username/email or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h1>Login</h1>

                {error && <p style={styles.error}>{error}</p>}

                <input
                    placeholder="Email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    style={styles.input}
                />

                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                <button disabled={isSubmitting} style={styles.button}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                <p>
                    No account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
    },
    card: {
        width: 380,
        padding: 32,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d1d5db",
    },
    button: {
        padding: 12,
        borderRadius: 8,
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
    },
    error: {
        color: "#dc2626",
    },
};