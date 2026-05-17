using Microsoft.AspNetCore.Http;

namespace ChatApp.Application.Messages.DTOs;

public class UploadAttachmentFormRequest
{
    public Guid ConversationId { get; set; }

    public string? Content { get; set; }

    public IFormFile File { get; set; } = null!;
}