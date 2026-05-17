import { axiosClient } from "./axiosClient";
import type { MessageResponse, SendMessageRequest } from "../types/chat";

export const messagesApi = {
    sendMessage: async (
        request: SendMessageRequest
    ): Promise<MessageResponse> => {
        const response = await axiosClient.post<MessageResponse>(
            "/messages",
            request
        );

        return response.data;
    },

    markAsRead: async (conversationId: string): Promise<void> => {
        await axiosClient.post(`/messages/conversations/${conversationId}/read`);
    },

    uploadAttachment: async (
        conversationId: string,
        file: File,
        content?: string
    ): Promise<MessageResponse> => {
        const formData = new FormData();

        formData.append("conversationId", conversationId);

        if (content) {
            formData.append("content", content);
        }

        formData.append("file", file);

        const response = await axiosClient.post<MessageResponse>(
            "/messages/attachments",
            formData
        );

        return response.data;
    },
};
