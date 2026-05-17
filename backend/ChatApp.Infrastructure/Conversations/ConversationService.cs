using ChatApp.Application.Conversations.DTOs;
using ChatApp.Application.Conversations.Interfaces;
using ChatApp.Application.Messages.DTOs;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Conversations;

public class ConversationService : IConversationService
{
    private readonly AppDbContext _dbContext;

    public ConversationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ConversationResponse>> GetMyConversationsAsync(Guid userId)
    {
        var conversations = await _dbContext.Conversations
            .AsNoTracking()
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Include(c => c.Messages)
            .OrderByDescending(c =>
                c.Messages.Any()
                    ? c.Messages.Max(m => m.CreatedAt)
                    : c.CreatedAt)
            .ToListAsync();

        return conversations.Select(c => MapConversation(c, userId)).ToList();
    }

    public async Task<ConversationResponse> GetConversationByIdAsync(Guid userId, Guid conversationId)
    {
        var conversation = await _dbContext.Conversations
            .AsNoTracking()
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c =>
                c.Id == conversationId &&
                c.Members.Any(m => m.UserId == userId));

        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        return MapConversation(conversation, userId);
    }

    public async Task<ConversationResponse> CreateDirectConversationAsync(
        Guid currentUserId,
        CreateDirectConversationRequest request)
    {
        if (currentUserId == request.OtherUserId)
        {
            throw new InvalidOperationException("You cannot create a conversation with yourself.");
        }

        var otherUserExists = await _dbContext.Users
            .AnyAsync(x => x.Id == request.OtherUserId);

        if (!otherUserExists)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var existingConversation = await _dbContext.Conversations
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c =>
                c.Type == ConversationType.Direct &&
                c.Members.Any(m => m.UserId == currentUserId) &&
                c.Members.Any(m => m.UserId == request.OtherUserId));

        if (existingConversation != null)
        {
            return MapConversation(existingConversation, currentUserId);
        }

        var conversation = new Conversation
        {
            Type = ConversationType.Direct,
            CreatedAt = DateTime.UtcNow,
            Members = new List<ConversationMember>
            {
                new()
                {
                    UserId = currentUserId,
                    Role = ConversationRole.Member,
                    JoinedAt = DateTime.UtcNow
                },
                new()
                {
                    UserId = request.OtherUserId,
                    Role = ConversationRole.Member,
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _dbContext.Conversations.Add(conversation);

        await _dbContext.SaveChangesAsync();

        return await GetConversationByIdAsync(currentUserId, conversation.Id);
    }

    public async Task<ConversationResponse> CreateGroupConversationAsync(
        Guid currentUserId,
        CreateGroupConversationRequest request)
    {
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Group name is required.");
        }

        var memberIds = request.MemberIds
            .Where(x => x != currentUserId)
            .Distinct()
            .ToList();

        if (memberIds.Count < 1)
        {
            throw new InvalidOperationException("A group conversation must have at least one other member.");
        }

        var existingUsersCount = await _dbContext.Users
            .CountAsync(x => memberIds.Contains(x.Id));

        if (existingUsersCount != memberIds.Count)
        {
            throw new KeyNotFoundException("One or more users were not found.");
        }

        var conversation = new Conversation
        {
            Type = ConversationType.Group,
            Name = name,
            CreatedAt = DateTime.UtcNow,
            Members = new List<ConversationMember>
            {
                new()
                {
                    UserId = currentUserId,
                    Role = ConversationRole.Owner,
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        foreach (var memberId in memberIds)
        {
            conversation.Members.Add(new ConversationMember
            {
                UserId = memberId,
                Role = ConversationRole.Member,
                JoinedAt = DateTime.UtcNow
            });
        }

        _dbContext.Conversations.Add(conversation);

        await _dbContext.SaveChangesAsync();

        return await GetConversationByIdAsync(currentUserId, conversation.Id);
    }

    public async Task<List<MessageResponse>> GetMessagesAsync(
        Guid userId,
        Guid conversationId,
        int page,
        int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 50 : pageSize;

        var isMember = await _dbContext.ConversationMembers
            .AnyAsync(x => x.ConversationId == conversationId && x.UserId == userId);

        if (!isMember)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        var messages = await _dbContext.Messages
            .AsNoTracking()
            .Where(x => x.ConversationId == conversationId)
            .Include(x => x.Sender)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MessageResponse
            {
                Id = x.Id,
                ConversationId = x.ConversationId,
                SenderId = x.SenderId,
                SenderUsername = x.Sender.Username,
                SenderAvatarUrl = x.Sender.AvatarUrl,
                Content = x.Content,
                Type = x.Type,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                EditedAt = x.EditedAt,
                DeletedAt = x.DeletedAt,
                ReplyToMessageId = x.ReplyToMessageId
            })
            .ToListAsync();

        return messages
            .OrderBy(x => x.CreatedAt)
            .ToList();
    }

    private static ConversationResponse MapConversation(
        Conversation conversation,
        Guid currentUserId)
    {
        var lastMessage = conversation.Messages
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();

        var currentMember = conversation.Members
            .FirstOrDefault(x => x.UserId == currentUserId);

        var unreadCount = conversation.Messages.Count(message =>
            message.SenderId != currentUserId &&
            (
                currentMember?.LastReadMessageId == null ||
                message.CreatedAt >
                conversation.Messages
                    .FirstOrDefault(x => x.Id == currentMember.LastReadMessageId)
                    ?.CreatedAt
            ));

        return new ConversationResponse
        {
            Id = conversation.Id,
            Type = conversation.Type,
            Name = conversation.Name,
            ImageUrl = conversation.ImageUrl,
            CreatedAt = conversation.CreatedAt,
            LastMessage = lastMessage?.Content,
            LastMessageAt = lastMessage?.CreatedAt,
            UnreadCount = unreadCount,
            Members = conversation.Members.Select(m => new ConversationMemberResponse
            {
                UserId = m.UserId,
                Username = m.User.Username,
                AvatarUrl = m.User.AvatarUrl,
                IsOnline = m.User.IsOnline,
                LastSeenAt = m.User.LastSeenAt
            }).ToList()
        };
    }
}