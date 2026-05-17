using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class ConversationMember : BaseEntity
{
    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public ConversationRole Role { get; set; } = ConversationRole.Member;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Guid? LastReadMessageId { get; set; }

    public Message? LastReadMessage { get; set; }

    public bool IsMuted { get; set; }

    public bool IsArchived { get; set; }
}