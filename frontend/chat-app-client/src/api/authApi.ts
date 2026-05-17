import { axiosClient } from "./axiosClient";
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from "../types/auth";

export const authApi = {
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(
      "/auth/register",
      request
    );

    return response.data;
  },

  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(
      "/auth/login",
      request
    );

    return response.data;
  },

  refreshToken: async (
    request: RefreshTokenRequest
  ): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(
      "/auth/refresh-token",
      request
    );

    return response.data;
  },

  me: async (): Promise<CurrentUserResponse> => {
    const response = await axiosClient.get<CurrentUserResponse>("/auth/me");

    return response.data;
  },
};