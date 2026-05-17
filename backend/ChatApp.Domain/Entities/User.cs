using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public bool IsOnline { get; set; }

    public DateTime? LastSeenAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public ICollection<ConversationMember> ConversationMembers { get; set; } = new List<ConversationMember>();

    public ICollection<Message> SentMessages { get; set; } = new List<Message>();

    public ICollection<MessageReaction> MessageReactions { get; set; } = new List<MessageReaction>();

    public ICollection<Call> StartedCalls { get; set; } = new List<Call>();

    public ICollection<Call> ReceivedCalls { get; set; } = new List<Call>();
}