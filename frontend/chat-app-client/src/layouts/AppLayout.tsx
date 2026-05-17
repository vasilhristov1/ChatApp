import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../config";

export function AppLayout() {
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const avatarUrl = user?.avatarUrl
        ? `${API_URL}${user.avatarUrl}`
        : null;

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <header
                style={{
                    height: 72,
                    background: "#111827",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
            >
                {/* Left side - Logo + App name */}
                <Link
                    to="/chat"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        color: "white",
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="ChatApp Logo"
                        style={{
                            width: 42,
                            height: 42,
                            objectFit: "contain",
                        }}
                    />

                    <strong
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                        }}
                    >
                        ChatApp
                    </strong>
                </Link>

                {/* Right side - Profile + Logout */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                    }}
                >
                    <Link
                        to="/profile"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: 999,
                            transition: "background 0.2s ease",
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={user?.username ?? "User"}
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid rgba(255,255,255,0.25)",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background:
                                        "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: "white",
                                }}
                            >
                                {user?.username?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}

                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: 15,
                            }}
                        >
                            {user?.username}
                        </span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main
                style={{
                    padding: 24,
                    maxWidth: 1600,
                    margin: "0 auto",
                }}
            >
                <Outlet />
            </main>
        </div>
    );
}