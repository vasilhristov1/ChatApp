namespace ChatApp.Application.Conversations.DTOs;

public class ConversationMemberResponse
{
    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public bool IsOnline { get; set; }

    public DateTime? LastSeenAt { get; set; }
}