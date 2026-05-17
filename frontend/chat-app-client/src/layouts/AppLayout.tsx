import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function AppLayout() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <header
                style={{
                    height: 64,
                    background: "#111827",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                }}
            >
                <strong>ChatApp</strong>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span>{user?.username}</span>

                    <Link to="/profile" style={{ color: "white" }}>
                        Profile
                    </Link>

                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main style={{ padding: 24 }}>
                <Outlet />
            </main>
        </div>
    );
}