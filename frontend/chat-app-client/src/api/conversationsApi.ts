import { axiosClient } from "./axiosClient";
import type {
  ConversationResponse,
  CreateDirectConversationRequest,
  MessageResponse,
} from "../types/chat";

export const conversationsApi = {
  getMyConversations: async (): Promise<ConversationResponse[]> => {
    const response = await axiosClient.get<ConversationResponse[]>("/conversations");
    return response.data;
  },

  getConversationById: async (
    conversationId: string
  ): Promise<ConversationResponse> => {
    const response = await axiosClient.get<ConversationResponse>(
      `/conversations/${conversationId}`
    );

    return response.data;
  },

  createDirectConversation: async (
    request: CreateDirectConversationRequest
  ): Promise<ConversationResponse> => {
    const response = await axiosClient.post<ConversationResponse>(
      "/conversations/direct",
      request
    );

    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page = 1,
    pageSize = 50
  ): Promise<MessageResponse[]> => {
    const response = await axiosClient.get<MessageResponse[]>(
      `/conversations/${conversationId}/messages`,
      {
        params: {
          page,
          pageSize,
        },
      }
    );

    return response.data;
  },
};