import { useQuery } from "@tanstack/react-query";
import { conversationsApi } from "../../api/conversationsApi";
import { messagesApi } from "../../api/messagesApi";

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return [];
      }

      const messages = await conversationsApi.getMessages(conversationId);
      await messagesApi.markAsRead(conversationId);

      return messages;
    },
    enabled: Boolean(conversationId),
  });
}