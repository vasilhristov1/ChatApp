using ChatApp.Domain.Enums;

namespace ChatApp.Application.Conversations.DTOs;

public class ConversationResponse
{
    public Guid Id { get; set; }

    public ConversationType Type { get; set; }

    public string? Name { get; set; }

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? LastMessage { get; set; }

    public DateTime? LastMessageAt { get; set; }

    public int UnreadCount { get; set; }
    
    public List<ConversationMemberResponse> Members { get; set; } = new();
}