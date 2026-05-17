import { useEffect, useRef, useState } from "react";
import type * as signalR from "@microsoft/signalr";
import { createChatConnection } from "../../signalr/chatConnection";
import type { MessageResponse } from "../../types/chat";

interface UseChatConnectionParams {
  accessToken: string | null;
  selectedConversationId?: string;
  onMessageReceived: (message: MessageResponse) => void;
  onConversationUpdated: () => void;
}

export function useChatConnection({
  accessToken,
  selectedConversationId,
  onMessageReceived,
  onConversationUpdated,
}: UseChatConnectionParams) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const joinedConversationRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const connection = createChatConnection(accessToken);
    connectionRef.current = connection;

    connection.on("ReceiveMessage", (message: MessageResponse) => {
      onMessageReceived(message);
      onConversationUpdated();
    });

    connection.on("UserTypingStarted", (payload: {
      conversationId: string;
      userId: string;
    }) => {
      if (payload.conversationId !== selectedConversationId) {
        return;
      }

      setTypingUserIds((previous) => {
        if (previous.includes(payload.userId)) {
          return previous;
        }

        return [...previous, payload.userId];
      });
    });

    connection.on("UserTypingStopped", (payload: {
      conversationId: string;
      userId: string;
    }) => {
      if (payload.conversationId !== selectedConversationId) {
        return;
      }

      setTypingUserIds((previous) =>
        previous.filter((userId) => userId !== payload.userId)
      );
    });

    connection.on("MessageDelivered", () => {
      onConversationUpdated();
    });

    connection.on("MessagesRead", () => {
      onConversationUpdated();
    });

    connection.on("UserOnline", () => {
      onConversationUpdated();
    });

    connection.on("UserOffline", () => {
      onConversationUpdated();
    });

    connection.onreconnected(() => {
      setIsConnected(true);
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch((error) => {
        console.error("SignalR connection failed:", error);
        setIsConnected(false);
      });

    return () => {
      connection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, selectedConversationId]);

  useEffect(() => {
    const connection = connectionRef.current;

    if (!connection || !selectedConversationId) {
      return;
    }

    if (connection.state !== "Connected") {
      return;
    }

    const joinConversation = async () => {
      if (joinedConversationRef.current) {
        await connection.invoke(
          "LeaveConversation",
          joinedConversationRef.current
        );
      }

      await connection.invoke("JoinConversation", selectedConversationId);
      joinedConversationRef.current = selectedConversationId;

      await connection.invoke("MarkAsRead", selectedConversationId);
    };

    joinConversation().catch((error) => {
      console.error("Failed to join conversation:", error);
    });
  }, [selectedConversationId, isConnected]);

  const sendMessage = async (
    conversationId: string,
    content: string,
    type: number,
    replyToMessageId: string | null = null
  ) => {
    const connection = connectionRef.current;

    if (!connection || connection.state !== "Connected") {
      throw new Error("Chat connection is not active.");
    }

    await connection.invoke("SendMessage", {
      conversationId,
      content,
      type,
      replyToMessageId,
    });
  };

  const sendTypingStarted = async (conversationId: string) => {
    const connection = connectionRef.current;

    if (!connection || connection.state !== "Connected") {
      return;
    }

    await connection.invoke("TypingStarted", conversationId);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(async () => {
      await connection.invoke("TypingStopped", conversationId);
    }, 1000);
  };

  return {
    isConnected,
    typingUserIds,
    sendMessage,
    sendTypingStarted,
  };
}