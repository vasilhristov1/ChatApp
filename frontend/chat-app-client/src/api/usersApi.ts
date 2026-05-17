import { axiosClient } from "./axiosClient";
import type {
  CurrentUserResponse,
  UpdateProfileRequest,
} from "../types/auth";
import type { UserSearchResponse } from "../types/user";

export const usersApi = {
  searchUsers: async (query: string): Promise<UserSearchResponse[]> => {
    const response = await axiosClient.get<UserSearchResponse[]>(
      "/users/search",
      {
        params: { query },
      }
    );

    return response.data;
  },

  updateProfile: async (
    request: UpdateProfileRequest
  ): Promise<CurrentUserResponse> => {
    const response = await axiosClient.put<CurrentUserResponse>(
      "/users/me",
      request
    );

    return response.data;
  },

  uploadAvatar: async (file: File): Promise<CurrentUserResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<CurrentUserResponse>(
      "/users/me/avatar",
      formData
    );

    return response.data;
  },
};