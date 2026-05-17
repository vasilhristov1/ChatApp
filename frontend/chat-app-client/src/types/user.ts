export interface UserSearchResponse {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  lastSeenAt?: string | null;
}