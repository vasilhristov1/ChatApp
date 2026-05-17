using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    public Guid SenderId { get; set; }

    public User Sender { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public MessageType Type { get; set; } = MessageType.Text;

    public MessageStatus Status { get; set; } = MessageStatus.Sent;

    public DateTime? EditedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
    
    public string? AttachmentUrl { get; set; }

    public string? AttachmentFileName { get; set; }

    public string? AttachmentContentType { get; set; }

    public long? AttachmentSizeInBytes { get; set; }

    public Guid? ReplyToMessageId { get; set; }

    public Message? ReplyToMessage { get; set; }

    public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
}