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
import { API_URL } from "../config";
import "./ChatPage.css";

export function ChatPage() {
    const currentUser = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);

    const [selectedConversation, setSelectedConversation] =
        useState<ConversationResponse | null>(null);

    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

                await refetchConversations();
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

    const selectedOtherMember = useMemo(() => {
        if (!selectedConversation || !currentUser) {
            return null;
        }

        return (
            selectedConversation.members.find(
                (member) => member.userId !== currentUser.id
            ) ?? null
        );
    }, [selectedConversation, currentUser]);

    const selectedTitle = useMemo(() => {
        if (!selectedConversation) {
            return "Select a conversation";
        }

        if (selectedConversation.type === 2 && selectedConversation.name) {
            return selectedConversation.name;
        }

        return selectedOtherMember?.username ?? "Conversation";
    }, [selectedConversation, selectedOtherMember]);

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

    const getAvatarUrl = (avatarUrl?: string | null) => {
        return avatarUrl ? `${API_URL}${avatarUrl}` : null;
    };

    const startDirectConversation = async (userId: string) => {
        const conversation = await conversationsApi.createDirectConversation({
            otherUserId: userId,
        });

        setSelectedConversation(conversation);
        setIsMobileChatOpen(true);
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [visibleMessages.length, selectedConversation?.id]);

    return (
        <>
            <div className="chat-shell">
                <aside
                    className={`chat-sidebar ${
                        isMobileChatOpen ? "mobile-hidden" : ""
                    }`}
                >
                    <div className="chat-sidebar-brand">
                        <div className="chat-brand-mark">
                            {currentUser?.username?.[0]?.toUpperCase() ?? "C"}
                        </div>

                        <div>
                            <div className="chat-brand-title">ChatApp</div>
                            <div className="chat-brand-status">
                                {isConnected ? "Live connection" : "Offline"}
                            </div>
                        </div>
                    </div>

                    <div className="chat-sidebar-top">
                        <input
                            placeholder="Search messages or users..."
                            value={userSearch}
                            onChange={(event) => setUserSearch(event.target.value)}
                            className="chat-search"
                        />

                        {searchResults.length > 0 && (
                            <div className="chat-search-results">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => startDirectConversation(user.id)}
                                        className="chat-search-result"
                                    >
                                        <strong>{user.username}</strong>
                                        <span>{user.email}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="chat-list">
                        {isLoadingConversations && (
                            <p className="chat-loading">Loading conversations...</p>
                        )}

                        {conversations.map((conversation) => {
                            const otherMember = conversation.members.find(
                                (member) => member.userId !== currentUser?.id
                            );

                            const title =
                                conversation.type === 2
                                    ? conversation.name
                                    : otherMember?.username ?? "Conversation";

                            const avatarUrl = getAvatarUrl(otherMember?.avatarUrl);
                            const isSelected = selectedConversation?.id === conversation.id;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => {
                                        setSelectedConversation(conversation);
                                        setIsMobileChatOpen(true);
                                    }}
                                    className={`chat-conversation ${
                                        isSelected ? "active" : ""
                                    }`}
                                >
                                    <div className="chat-avatar-wrap">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={title ?? "User"}
                                                className="chat-avatar"
                                            />
                                        ) : (
                                            <div className="chat-avatar-placeholder">
                                                {title?.[0]?.toUpperCase() ?? "C"}
                                            </div>
                                        )}

                                        {otherMember?.isOnline && (
                                            <span className="chat-online-dot" />
                                        )}
                                    </div>

                                    <div className="chat-conversation-body">
                                        <div className="chat-conversation-name">
                                            {title}
                                        </div>

                                        <div className="chat-conversation-last">
                                            {conversation.lastMessage ??
                                                "No messages yet"}
                                        </div>
                                    </div>

                                    <div className="chat-conversation-meta">
                                        {conversation.lastMessageAt && (
                                            <span>
                                                {new Date(
                                                    conversation.lastMessageAt
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}

                                        {conversation.unreadCount > 0 && (
                                            <span className="chat-unread">
                                                {conversation.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section
                    className={`chat-main ${
                        !isMobileChatOpen ? "mobile-hidden" : ""
                    }`}
                >
                    <header className="chat-header">
                        <div className="chat-header-user">
                            <button
                                className="mobile-back"
                                onClick={() => setIsMobileChatOpen(false)}
                            >
                                ←
                            </button>

                            {selectedConversation && (
                                <div className="chat-avatar-wrap">
                                    {getAvatarUrl(selectedOtherMember?.avatarUrl) ? (
                                        <img
                                            src={getAvatarUrl(
                                                selectedOtherMember?.avatarUrl
                                            )!}
                                            alt={selectedTitle}
                                            className="chat-header-avatar"
                                        />
                                    ) : (
                                        <div className="chat-header-avatar-placeholder">
                                            {selectedTitle[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    {selectedOtherMember?.isOnline && (
                                        <span className="chat-online-dot" />
                                    )}
                                </div>
                            )}

                            <div>
                                <div className="chat-header-name">{selectedTitle}</div>
                                <div className="chat-header-status">
                                    {selectedConversation
                                        ? selectedOtherMember?.isOnline
                                            ? "Online"
                                            : "Offline"
                                        : "Choose a conversation"}
                                </div>
                            </div>
                        </div>

                        {selectedConversation && (
                            <div className="chat-header-actions">
                                <button className="chat-icon-button">☎</button>

                                <button
                                    onClick={handleStartVideoCall}
                                    disabled={isStartingCall || isCallOpen}
                                    className="chat-icon-button"
                                    title="Video call"
                                >
                                    {isStartingCall ? "…" : "▣"}
                                </button>

                                <button className="chat-icon-button">⋮</button>
                            </div>
                        )}
                    </header>

                    <div className="chat-messages">
                        {!selectedConversation && (
                            <div className="chat-empty">
                                <h2>Welcome to ChatApp</h2>
                                <p>Select a conversation or search for a user.</p>
                            </div>
                        )}

                        {selectedConversation && isLoadingMessages && (
                            <p className="chat-loading">Loading messages...</p>
                        )}

                        {selectedConversation &&
                            !isLoadingMessages &&
                            visibleMessages.map((message) => {
                                const isMine = message.senderId === currentUser?.id;
                                const senderAvatarUrl = getAvatarUrl(
                                    message.senderAvatarUrl
                                );

                                return (
                                    <div
                                        key={message.id}
                                        className={`message-row ${
                                            isMine ? "mine" : "other"
                                        }`}
                                    >
                                        {!isMine && (
                                            <div className="message-avatar-wrap">
                                                {senderAvatarUrl ? (
                                                    <img
                                                        src={senderAvatarUrl}
                                                        alt={message.senderUsername}
                                                        className="message-avatar"
                                                    />
                                                ) : (
                                                    <div className="message-avatar-placeholder">
                                                        {message.senderUsername[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div
                                            className={`message-bubble ${
                                                isMine ? "mine" : "other"
                                            }`}
                                        >
                                            {!isMine && (
                                                <div className="message-sender">
                                                    {message.senderUsername}
                                                </div>
                                            )}

                                            {message.content && (
                                                <div className="message-content">
                                                    {message.content}
                                                </div>
                                            )}

                                            {"attachmentUrl" in message &&
                                                message.attachmentUrl && (
                                                    <>
                                                        {message.attachmentContentType?.startsWith(
                                                            "image/"
                                                        ) ? (
                                                            <img
                                                                src={`${API_URL}${message.attachmentUrl}`}
                                                                alt={
                                                                    message.attachmentFileName ??
                                                                    "Attachment"
                                                                }
                                                                className="message-image"
                                                            />
                                                        ) : (
                                                            <a
                                                                href={`${API_URL}${message.attachmentUrl}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="file-link"
                                                            >
                                                                📄{" "}
                                                                {message.attachmentFileName ??
                                                                    "Download file"}
                                                            </a>
                                                        )}
                                                    </>
                                                )}

                                            <div className="message-time">
                                                {"isOptimistic" in message
                                                    ? "Sending..."
                                                    : new Date(
                                                          message.createdAt
                                                      ).toLocaleTimeString([], {
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
                        <div className="typing-indicator">
                            {typingUserIds.length === 1
                                ? "Someone is typing..."
                                : `${typingUserIds.length} people are typing...`}
                        </div>
                    )}

                    {selectedConversation && (
                        <footer className="chat-input-bar">
                            <div className="chat-input-inner">
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
                                    className="chat-attach"
                                >
                                    {isUploading ? "…" : "📎"}
                                </button>

                                <textarea
                                    placeholder="Type a message..."
                                    value={messageText}
                                    onChange={(event) =>
                                        handleMessageTextChange(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />

                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !isConnected}
                                    className="chat-send"
                                >
                                    Send
                                </button>
                            </div>
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