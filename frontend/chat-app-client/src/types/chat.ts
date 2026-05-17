export enum ConversationType {
    Direct = 1,
    Group = 2,
}

export enum MessageType {
    Text = 1,
    Image = 2,
    File = 3,
    Voice = 4,
    System = 5,
}

export enum MessageStatus {
    Sent = 1,
    Delivered = 2,
    Read = 3,
    Edited = 4,
    Deleted = 5,
}

export interface ConversationMemberResponse {
    userId: string;
    username: string;
    avatarUrl?: string | null;
    isOnline: boolean;
    lastSeenAt?: string | null;
}

export interface ConversationResponse {
    id: string;
    type: ConversationType;
    name?: string | null;
    imageUrl?: string | null;
    createdAt: string;
    lastMessage?: string | null;
    lastMessageAt?: string | null;
    unreadCount: number;
    members: ConversationMemberResponse[];
}

export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    senderAvatarUrl?: string | null;
    content: string;
    type: MessageType;
    status: MessageStatus;
    createdAt: string;
    editedAt?: string | null;
    deletedAt?: string | null;
    replyToMessageId?: string | null;
    attachmentUrl?: string | null;
    attachmentFileName?: string | null;
    attachmentContentType?: string | null;
    attachmentSizeInBytes?: number | null;
}

export interface SendMessageRequest {
    conversationId: string;
    content: string;
    type: MessageType;
    replyToMessageId?: string | null;
}

export interface CreateDirectConversationRequest {
    otherUserId: string;
}