using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Call : BaseEntity
{
    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    public Guid CallerId { get; set; }

    public User Caller { get; set; } = null!;

    public Guid? ReceiverId { get; set; }

    public User? Receiver { get; set; }

    public CallStatus Status { get; set; } = CallStatus.Ringing;

    public DateTime? AcceptedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public int? DurationInSeconds { get; set; }
}