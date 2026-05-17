namespace ChatApp.Application.Messages.DTOs;

public class UploadMessageAttachmentRequest
{
    public Guid ConversationId { get; set; }

    public string? Content { get; set; }
}