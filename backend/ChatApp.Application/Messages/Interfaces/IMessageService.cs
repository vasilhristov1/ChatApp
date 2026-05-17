using ChatApp.Application.Messages.DTOs;

namespace ChatApp.Application.Messages.Interfaces;

public interface IMessageService
{
    Task<MessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest request);

    Task<bool> IsUserInConversationAsync(Guid userId, Guid conversationId);

    Task MarkMessagesAsReadAsync(Guid userId, Guid conversationId);
    
    Task<MessageResponse> SendAttachmentMessageAsync(
        Guid senderId,
        Guid conversationId,
        string? content,
        string attachmentUrl,
        string fileName,
        string contentType,
        long sizeInBytes);
}