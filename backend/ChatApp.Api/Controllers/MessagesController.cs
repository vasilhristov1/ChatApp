using ChatApp.Api.Extensions;
using ChatApp.Application.Messages.DTOs;
using ChatApp.Application.Messages.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpPost]
    public async Task<ActionResult<MessageResponse>> SendMessage(SendMessageRequest request)
    {
        var userId = User.GetUserId();

        var message = await _messageService.SendMessageAsync(userId, request);

        return Ok(message);
    }
    
    [HttpPost("conversations/{conversationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid conversationId)
    {
        var userId = User.GetUserId();

        await _messageService.MarkMessagesAsReadAsync(userId, conversationId);

        return NoContent();
    }
    
    [HttpPost("attachments")]
    [RequestSizeLimit(20_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<MessageResponse>> UploadAttachment(
        [FromForm] UploadAttachmentFormRequest request)
    {
        var file = request.File;

        if (file == null || file.Length == 0)
        {
            throw new InvalidOperationException("File is required.");
        }

        var allowedContentTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "text/plain"
        };

        if (!allowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("File type is not allowed.");
        }

        var userId = User.GetUserId();

        var uploadsFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "uploads",
            "messages");

        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName);
        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, safeFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/messages/{safeFileName}";

        var message = await _messageService.SendAttachmentMessageAsync(
            userId,
            request.ConversationId,
            request.Content,
            fileUrl,
            file.FileName,
            file.ContentType,
            file.Length);

        return Ok(message);
    }
}