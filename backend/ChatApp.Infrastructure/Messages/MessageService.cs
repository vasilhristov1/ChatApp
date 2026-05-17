using ChatApp.Application.Messages.DTOs;
using ChatApp.Application.Messages.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Messages;

public class MessageService : IMessageService
{
    private readonly AppDbContext _dbContext;

    public MessageService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest request)
    {
        var content = request.Content.Trim();

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("Message content is required.");
        }

        if (content.Length > 5000)
        {
            throw new InvalidOperationException("Message content cannot exceed 5000 characters.");
        }

        var isMember = await IsUserInConversationAsync(senderId, request.ConversationId);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("You are not a member of this conversation.");
        }

        if (request.ReplyToMessageId.HasValue)
        {
            var replyExists = await _dbContext.Messages
                .AnyAsync(x =>
                    x.Id == request.ReplyToMessageId.Value &&
                    x.ConversationId == request.ConversationId);

            if (!replyExists)
            {
                throw new KeyNotFoundException("Reply message not found.");
            }
        }

        var message = new Message
        {
            ConversationId = request.ConversationId,
            SenderId = senderId,
            Content = content,
            Type = request.Type,
            Status = MessageStatus.Sent,
            ReplyToMessageId = request.ReplyToMessageId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Messages.Add(message);

        await _dbContext.SaveChangesAsync();

        var savedMessage = await _dbContext.Messages
            .AsNoTracking()
            .Include(x => x.Sender)
            .FirstAsync(x => x.Id == message.Id);

        return MapMessage(savedMessage);
    }

    public async Task<bool> IsUserInConversationAsync(Guid userId, Guid conversationId)
    {
        return await _dbContext.ConversationMembers
            .AnyAsync(x =>
                x.UserId == userId &&
                x.ConversationId == conversationId);
    }
    
    public async Task MarkMessagesAsReadAsync(Guid userId, Guid conversationId)
    {
        var isMember = await IsUserInConversationAsync(userId, conversationId);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("You are not a member of this conversation.");
        }

        var unreadMessages = await _dbContext.Messages
            .Where(x =>
                x.ConversationId == conversationId &&
                x.SenderId != userId &&
                x.Status != MessageStatus.Read)
            .ToListAsync();

        foreach (var message in unreadMessages)
        {
            message.Status = MessageStatus.Read;
        }

        var latestMessage = await _dbContext.Messages
            .Where(x => x.ConversationId == conversationId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        var member = await _dbContext.ConversationMembers
            .FirstOrDefaultAsync(x =>
                x.ConversationId == conversationId &&
                x.UserId == userId);

        if (member != null && latestMessage != null)
        {
            member.LastReadMessageId = latestMessage.Id;
        }

        await _dbContext.SaveChangesAsync();
    }
    
    public async Task<MessageResponse> SendAttachmentMessageAsync(
        Guid senderId,
        Guid conversationId,
        string? content,
        string attachmentUrl,
        string fileName,
        string contentType,
        long sizeInBytes)
    {
        var isMember = await IsUserInConversationAsync(senderId, conversationId);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("You are not a member of this conversation.");
        }

        var messageType = contentType.StartsWith("image/")
            ? MessageType.Image
            : MessageType.File;

        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content?.Trim() ?? string.Empty,
            Type = messageType,
            Status = MessageStatus.Sent,
            AttachmentUrl = attachmentUrl,
            AttachmentFileName = fileName,
            AttachmentContentType = contentType,
            AttachmentSizeInBytes = sizeInBytes,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Messages.Add(message);

        await _dbContext.SaveChangesAsync();

        var savedMessage = await _dbContext.Messages
            .AsNoTracking()
            .Include(x => x.Sender)
            .FirstAsync(x => x.Id == message.Id);

        return MapMessage(savedMessage);
    }
    
    private static MessageResponse MapMessage(Message message)
    {
        return new MessageResponse
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderUsername = message.Sender.Username,
            SenderAvatarUrl = message.Sender.AvatarUrl,
            Content = message.Content,
            Type = message.Type,
            Status = message.Status,
            CreatedAt = message.CreatedAt,
            EditedAt = message.EditedAt,
            DeletedAt = message.DeletedAt,
            ReplyToMessageId = message.ReplyToMessageId,
            AttachmentUrl = message.AttachmentUrl,
            AttachmentFileName = message.AttachmentFileName,
            AttachmentContentType = message.AttachmentContentType,
            AttachmentSizeInBytes = message.AttachmentSizeInBytes
        };
    }
}