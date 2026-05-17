export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  username: string;
  bio?: string | null;
}