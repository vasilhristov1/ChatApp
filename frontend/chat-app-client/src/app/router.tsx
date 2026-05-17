import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { PublicRoute } from "../routes/PublicRoute";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { HomePage } from "../pages/HomePage";
import { ProfilePage } from "../pages/ProfilePage";
import InitialPage from "../pages/InitialPage";

export const router = createBrowserRouter([
    {
        element: <PublicRoute />,
        children: [
            {
                path: "/",
                element: <InitialPage />,
            },
            {
                path: "/login",
                element: <LoginPage />,
            },
            {
                path: "/register",
                element: <RegisterPage />,
            },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        path: "/chat",
                        element: <HomePage />,
                    },
                    {
                        path: "/profile",
                        element: <ProfilePage />,
                    },
                ],
            },
        ],
    },
]);