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

    const avatarUrl = user?.avatarUrl ? `${API_URL}${user.avatarUrl}` : null;

    return (
        <div style={{ minHeight: "100vh", background: "#08090d" }}>
            <header
                style={{
                    height: 72,
                    background: "#08090d",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
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
                            width: 38,
                            height: 38,
                            objectFit: "contain",
                        }}
                    />

                    <strong
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                        }}
                    >
                        ChatApp
                    </strong>
                </Link>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
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
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={user?.username ?? "User"}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background:
                                        "linear-gradient(135deg, #7c3aed, #6366f1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                }}
                            >
                                {user?.username?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}

                        <span style={{ fontWeight: 700 }}>{user?.username}</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "9px 14px",
                            borderRadius: 10,
                            border: "none",
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main>
                <Outlet />
            </main>
        </div>
    );
}