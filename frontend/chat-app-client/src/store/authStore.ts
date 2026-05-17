import { create } from "zustand";
import type { CurrentUserResponse } from "../types/auth";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: CurrentUserResponse | null;
    isAuthenticated: boolean;

    setAuth: (
        accessToken: string,
        refreshToken: string,
        user: CurrentUserResponse
    ) => void;

    setTokens: (accessToken: string, refreshToken: string) => void;

    setUser: (user: CurrentUserResponse) => void;

    logout: () => void;
}

const accessTokenFromStorage = localStorage.getItem("accessToken");
const refreshTokenFromStorage = localStorage.getItem("refreshToken");
const userFromStorage = localStorage.getItem("user");

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: accessTokenFromStorage,
    refreshToken: refreshTokenFromStorage,
    user: userFromStorage ? JSON.parse(userFromStorage) : null,
    isAuthenticated: Boolean(accessTokenFromStorage),

    setAuth: (accessToken, refreshToken, user) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        set({
            accessToken,
            refreshToken,
            user,
            isAuthenticated: true,
        });
    },

    setUser: (user) => {
        localStorage.setItem("user", JSON.stringify(user));

        set({ user });
    },

    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
        });
    },

    logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
        });
    },
}));