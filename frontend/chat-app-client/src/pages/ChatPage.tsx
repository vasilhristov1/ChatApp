import { useEffect, useMemo, useRef, useState } from "react";
import { conversationsApi } from "../api/conversationsApi";
import { useChatConnection } from "../hooks/chat/useChatConnection";
import { useConversationMessages } from "../hooks/chat/useConversationMessages";
import { useConversations } from "../hooks/chat/useConversations";
import { useUserSearch } from "../hooks/chat/useUserSearch";
import { useAuthStore } from "../store/authStore";
import type { ConversationResponse } from "../types/chat";
import { MessageType } from "../types/chat";
import { IncomingCallPopup } from "../components/IncomingCallPopup";
import { VideoCallModal } from "../components/VideoCallModal";
import { useCallConnection } from "../hooks/chat/useCallConnection";
import { messagesApi } from "../api/messagesApi";

export function ChatPage() {
    const currentUser = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);

    const [selectedConversation, setSelectedConversation] =
        useState<ConversationResponse | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [messageText, setMessageText] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [optimisticMessages, setOptimisticMessages] = useState<
        {
            id: string;
            conversationId: string;
            senderId: string;
            senderUsername: string;
            senderAvatarUrl?: string | null;
            content: string;
            createdAt: string;
            isOptimistic: true;
        }[]
    >([]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const {
        data: conversations = [],
        isLoading: isLoadingConversations,
        refetch: refetchConversations,
    } = useConversations();

    const {
        data: messages = [],
        isLoading: isLoadingMessages,
        refetch: refetchMessages,
    } = useConversationMessages(selectedConversation?.id);

    const { data: searchResults = [] } = useUserSearch(userSearch);

    const { isConnected, typingUserIds, sendMessage, sendTypingStarted } =
        useChatConnection({
            accessToken,
            selectedConversationId: selectedConversation?.id,
            onMessageReceived: async (message) => {
                if (message.conversationId === selectedConversation?.id) {
                    await refetchMessages();
                }
            },
            onConversationUpdated: async () => {
                await refetchConversations();
            },
        });

    const {
        incomingCall,
        activeCall,
        isCallOpen,
        isMuted,
        isCameraOff,
        isStartingCall,
        isAcceptingCall,
        callError,
        connectionState,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    } = useCallConnection({
        accessToken,
        currentUserId: currentUser?.id,
    });

    const selectedTitle = useMemo(() => {
        if (!selectedConversation) {
            return "Select a conversation";
        }

        if (selectedConversation.type === 2 && selectedConversation.name) {
            return selectedConversation.name;
        }

        const otherMember = selectedConversation.members.find(
            (member) => member.userId !== currentUser?.id
        );

        return otherMember?.username ?? "Conversation";
    }, [selectedConversation, currentUser?.id]);

    const visibleMessages = useMemo(() => {
        return [...messages, ...optimisticMessages].filter(
            (message) => message.conversationId === selectedConversation?.id
        );
    }, [messages, optimisticMessages, selectedConversation?.id]);

    const getReceiverIdForSelectedConversation = () => {
        if (!selectedConversation || !currentUser) {
            return null;
        }

        const otherMember = selectedConversation.members.find(
            (member) => member.userId !== currentUser.id
        );

        return otherMember?.userId ?? null;
    };

    const startDirectConversation = async (userId: string) => {
        const conversation = await conversationsApi.createDirectConversation({
            otherUserId: userId,
        });

        setSelectedConversation(conversation);
        setUserSearch("");

        await refetchConversations();
    };

    const handleMessageTextChange = async (value: string) => {
        setMessageText(value);

        if (!selectedConversation) {
            return;
        }

        await sendTypingStarted(selectedConversation.id);
    };

    const handleSendMessage = async () => {
        if (!selectedConversation || !currentUser) {
            return;
        }

        const content = messageText.trim();

        if (!content) {
            return;
        }

        const optimisticId = crypto.randomUUID();

        setOptimisticMessages((previous) => [
            ...previous,
            {
                id: optimisticId,
                conversationId: selectedConversation.id,
                senderId: currentUser.id,
                senderUsername: currentUser.username,
                senderAvatarUrl: currentUser.avatarUrl,
                content,
                createdAt: new Date().toISOString(),
                isOptimistic: true,
            },
        ]);

        setMessageText("");
        setIsSending(true);

        try {
            await sendMessage(
                selectedConversation.id,
                content,
                MessageType.Text,
                null
            );

            setOptimisticMessages((previous) =>
                previous.filter((message) => message.id !== optimisticId)
            );

            await refetchMessages();
            await refetchConversations();
        } catch {
            setOptimisticMessages((previous) =>
                previous.filter((message) => message.id !== optimisticId)
            );

            setMessageText(content);
            alert("Message failed to send.");
        } finally {
            setIsSending(false);
        }
    };

    const handleStartVideoCall = async () => {
        if (!selectedConversation || isStartingCall || isCallOpen) {
            return;
        }

        const receiverId = getReceiverIdForSelectedConversation();

        if (!receiverId) {
            alert("Cannot start a call in this conversation.");
            return;
        }

        try {
            await startCall({
                conversationId: selectedConversation.id,
                receiverId,
            });
        } catch {
            alert("Could not start the call. Check camera/microphone permissions.");
        }
    };

    const handleFileSelected = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!selectedConversation) {
            return;
        }

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsUploading(true);

        try {
            await messagesApi.uploadAttachment(
                selectedConversation.id,
                file,
                messageText.trim() || undefined
            );

            setMessageText("");

            await refetchMessages();
            await refetchConversations();
        } finally {
            setIsUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteConversation = async (
        event: React.MouseEvent<HTMLButtonElement>,
        conversationId: string
    ) => {
        event.stopPropagation();

        const confirmed = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmed) {
            return;
        }

        await conversationsApi.deleteConversation(conversationId);

        if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null);
        }

        await refetchConversations();
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, selectedConversation?.id]);

    return (
        <>
            <div style={styles.container}>
                <aside style={styles.sidebar}>
                    <div style={styles.searchBox}>
                        <input
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(event) => setUserSearch(event.target.value)}
                            style={styles.input}
                        />

                        {searchResults.length > 0 && (
                            <div style={styles.searchResults}>
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => startDirectConversation(user.id)}
                                        style={styles.searchResultItem}
                                    >
                                        <strong>{user.username}</strong>
                                        <span style={styles.smallText}>{user.email}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.sidebarHeader}>
                        <h3>Conversations</h3>
                        <span
                            style={{
                                ...styles.connectionBadge,
                                background: isConnected ? "#dcfce7" : "#fee2e2",
                                color: isConnected ? "#166534" : "#991b1b",
                            }}
                        >
                            {isConnected ? "Live" : "Offline"}
                        </span>
                    </div>

                    {isLoadingConversations && <p>Loading...</p>}

                    <div style={styles.conversationList}>
                        {conversations.map((conversation) => {
                            const otherMember = conversation.members.find(
                                (member) => member.userId !== currentUser?.id
                            );

                            const title =
                                conversation.type === 2
                                    ? conversation.name
                                    : otherMember?.username ?? "Conversation";

                            const isSelected = selectedConversation?.id === conversation.id;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    style={{
                                        ...styles.conversationItem,
                                        background: isSelected ? "#e0ecff" : "white",
                                    }}
                                >
                                    <div style={styles.conversationHeader}>
                                        <strong>{title}</strong>
                                        {otherMember?.isOnline && (
                                            <span style={styles.onlineDot}>●</span>
                                        )}
                                    </div>

                                    <div style={styles.conversationFooter}>
                                        <span style={styles.lastMessage}>
                                            {conversation.lastMessage ?? "No messages yet"}
                                        </span>

                                        <div style={styles.conversationActions}>
                                            {conversation.unreadCount > 0 && (
                                                <span style={styles.unreadBadge}>{conversation.unreadCount}</span>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    handleDeleteConversation(event, conversation.id)
                                                }
                                                style={styles.deleteConversationButton}
                                                title="Delete conversation"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section style={styles.chatPanel}>
                    <header style={styles.chatHeader}>
                        <h2>{selectedTitle}</h2>

                        {selectedConversation && (
                            <button
                                onClick={handleStartVideoCall}
                                disabled={isStartingCall || isCallOpen}
                                style={{
                                    ...styles.callButton,
                                    opacity: isStartingCall || isCallOpen ? 0.6 : 1,
                                    cursor: isStartingCall || isCallOpen ? "not-allowed" : "pointer",
                                }}
                            >
                                {isStartingCall ? "Calling..." : "Video Call"}
                            </button>
                        )}
                    </header>

                    <div style={styles.messagesArea}>
                        {!selectedConversation && (
                            <p style={styles.emptyState}>
                                Choose a conversation or search a user.
                            </p>
                        )}

                        {selectedConversation && isLoadingMessages && (
                            <p>Loading messages...</p>
                        )}

                        {selectedConversation &&
                            !isLoadingMessages &&
                            visibleMessages.map((message) => {
                                const isMine = message.senderId === currentUser?.id;

                                return (
                                    <div
                                        key={message.id}
                                        style={{
                                            ...styles.messageRow,
                                            justifyContent: isMine ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...styles.messageBubble,
                                                background: isMine ? "#2563eb" : "#e5e7eb",
                                                color: isMine ? "white" : "#111827",
                                            }}
                                        >
                                            {!isMine && (
                                                <div style={styles.messageSenderRow}>
                                                    {message.senderAvatarUrl ? (
                                                        <img
                                                            src={`https://localhost:7039${message.senderAvatarUrl}`}
                                                            alt={message.senderUsername}
                                                            style={styles.smallAvatar}
                                                        />
                                                    ) : (
                                                        <div style={styles.smallAvatarPlaceholder}>
                                                            {message.senderUsername[0]?.toUpperCase()}
                                                        </div>
                                                    )}

                                                    <span style={styles.messageSender}>{message.senderUsername}</span>
                                                </div>
                                            )}

                                            <div>{message.content}</div>

                                            {"attachmentUrl" in message && message.attachmentUrl && (
                                                <>
                                                    {message.attachmentContentType?.startsWith("image/") ? (
                                                        <img
                                                            src={`https://localhost:7039${message.attachmentUrl}`}
                                                            alt={message.attachmentFileName ?? "Attachment"}
                                                            style={styles.messageImage}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={`https://localhost:7039${message.attachmentUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={styles.fileLink}
                                                        >
                                                            📄 {message.attachmentFileName ?? "Download file"}
                                                        </a>
                                                    )}
                                                </>
                                            )}

                                            <div style={styles.messageTime}>
                                                {"isOptimistic" in message
                                                    ? "Sending..."
                                                    : new Date(message.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                        <div ref={messagesEndRef} />
                    </div>

                    {selectedConversation && typingUserIds.length > 0 && (
                        <div style={styles.typingIndicator}>
                            {typingUserIds.length === 1
                                ? "Someone is typing..."
                                : `${typingUserIds.length} people are typing...`}
                        </div>
                    )}

                    {selectedConversation && (
                        <footer style={styles.messageInputArea}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.txt"
                                onChange={handleFileSelected}
                                style={{ display: "none" }}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                style={styles.attachButton}
                            >
                                {isUploading ? "..." : "📎"}
                            </button>

                            <textarea
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={(event) => handleMessageTextChange(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                style={styles.messageInput}
                            />

                            <button
                                onClick={handleSendMessage}
                                disabled={isSending || !isConnected}
                                style={styles.sendButton}
                            >
                                Send
                            </button>
                        </footer>
                    )}
                </section>
            </div>

            {incomingCall && (
                <IncomingCallPopup
                    call={incomingCall}
                    isAccepting={isAcceptingCall}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                />
            )}

            {isCallOpen && activeCall && (
                <VideoCallModal
                    call={activeCall}
                    localVideoRef={localVideoRef}
                    remoteVideoRef={remoteVideoRef}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    connectionState={connectionState}
                    callError={callError}
                    onToggleMute={toggleMute}
                    onToggleCamera={toggleCamera}
                    onEndCall={endCall}
                />
            )}
        </>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        height: "calc(100vh - 112px)",
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 16,
    },
    sidebar: {
        background: "white",
        borderRadius: 12,
        padding: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    sidebarHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    connectionBadge: {
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 8px",
        borderRadius: 999,
    },
    searchBox: {
        position: "relative",
        marginBottom: 16,
    },
    input: {
        width: "100%",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d1d5db",
    },
    searchResults: {
        position: "absolute",
        top: 48,
        left: 0,
        right: 0,
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
        zIndex: 10,
        overflow: "hidden",
    },
    searchResultItem: {
        width: "100%",
        padding: 12,
        background: "white",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    smallText: {
        fontSize: 12,
        color: "#6b7280",
    },
    conversationList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflowY: "auto",
    },
    conversationItem: {
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
    },
    conversationHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    onlineDot: {
        color: "#16a34a",
        fontSize: 14,
    },
    lastMessage: {
        fontSize: 13,
        color: "#6b7280",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "block",
    },
    chatPanel: {
        background: "white",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    chatHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    messagesArea: {
        flex: 1,
        padding: 20,
        overflowY: "auto",
        background: "#f9fafb",
    },
    emptyState: {
        color: "#6b7280",
    },
    messageRow: {
        display: "flex",
        marginBottom: 12,
    },
    messageBubble: {
        maxWidth: "65%",
        padding: "10px 12px",
        borderRadius: 14,
    },
    messageSender: {
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 11,
        opacity: 0.8,
        marginTop: 6,
        textAlign: "right",
    },
    typingIndicator: {
        padding: "8px 16px",
        fontSize: 13,
        color: "#6b7280",
        borderTop: "1px solid #e5e7eb",
    },
    messageInputArea: {
        padding: 16,
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        gap: 12,
    },
    messageInput: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d1d5db",
        resize: "none",
        minHeight: 44,
        maxHeight: 120,
    },
    sendButton: {
        padding: "0 20px",
        borderRadius: 8,
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
    },
    callButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: 8,
        background: "#16a34a",
        color: "white",
        cursor: "pointer",
    },
    conversationFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 999,
        background: "#2563eb",
        color: "white",
        fontSize: 12,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6px",
    },
    attachButton: {
        width: 44,
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: "white",
        cursor: "pointer",
    },
    messageImage: {
        display: "block",
        maxWidth: 260,
        maxHeight: 260,
        borderRadius: 10,
        marginTop: 8,
        objectFit: "cover",
    },
    fileLink: {
        display: "inline-block",
        marginTop: 8,
        color: "inherit",
        textDecoration: "underline",
    },
    messageSenderRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    smallAvatar: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
    },
    smallAvatarPlaceholder: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#9ca3af",
        color: "white",
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    conversationActions: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    deleteConversationButton: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: "none",
        background: "#ef4444",
        color: "white",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
};