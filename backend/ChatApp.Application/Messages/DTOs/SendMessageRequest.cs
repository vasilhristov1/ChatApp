using ChatApp.Domain.Enums;

namespace ChatApp.Application.Messages.DTOs;

public class SendMessageRequest
{
    public Guid ConversationId { get; set; }

    public string Content { get; set; } = string.Empty;

    public MessageType Type { get; set; } = MessageType.Text;

    public Guid? ReplyToMessageId { get; set; }
}