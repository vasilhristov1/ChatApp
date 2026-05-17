using ChatApp.Domain.Enums;

namespace ChatApp.Application.Messages.DTOs;

public class MessageResponse
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Guid SenderId { get; set; }

    public string SenderUsername { get; set; } = string.Empty;

    public string? SenderAvatarUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    public MessageType Type { get; set; }

    public MessageStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? EditedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? AttachmentUrl { get; set; }

    public string? AttachmentFileName { get; set; }

    public string? AttachmentContentType { get; set; }

    public long? AttachmentSizeInBytes { get; set; }
    
    public Guid? ReplyToMessageId { get; set; }
}