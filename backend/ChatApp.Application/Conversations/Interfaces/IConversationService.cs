using ChatApp.Application.Conversations.DTOs;
using ChatApp.Application.Messages.DTOs;

namespace ChatApp.Application.Conversations.Interfaces;

public interface IConversationService
{
    Task<List<ConversationResponse>> GetMyConversationsAsync(Guid userId);

    Task<ConversationResponse> GetConversationByIdAsync(Guid userId, Guid conversationId);

    Task<ConversationResponse> CreateDirectConversationAsync(Guid currentUserId, CreateDirectConversationRequest request);

    Task<ConversationResponse> CreateGroupConversationAsync(Guid currentUserId, CreateGroupConversationRequest request);

    Task<List<MessageResponse>> GetMessagesAsync(Guid userId, Guid conversationId, int page, int pageSize);
    Task DeleteConversationAsync(Guid userId, Guid conversationId);
}