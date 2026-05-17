using ChatApp.Api.Extensions;
using ChatApp.Application.Messages.DTOs;
using ChatApp.Application.Messages.Interfaces;
using ChatApp.Application.Presence.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;
    private readonly IPresenceService _presenceService;

    public ChatHub(
        IMessageService messageService,
        IPresenceService presenceService)
    {
        _messageService = messageService;
        _presenceService = presenceService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();

        await _presenceService.SetUserOnlineAsync(userId);

        await Clients.Others.SendAsync("UserOnline", new
        {
            UserId = userId
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User!.GetUserId();

        await _presenceService.SetUserOfflineAsync(userId);

        await Clients.Others.SendAsync("UserOffline", new
        {
            UserId = userId,
            LastSeenAt = DateTime.UtcNow
        });

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinConversation(Guid conversationId)
    {
        var userId = Context.User!.GetUserId();

        var isMember = await _messageService.IsUserInConversationAsync(
            userId,
            conversationId);

        if (!isMember)
        {
            throw new HubException("You are not a member of this conversation.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetConversationGroupName(conversationId));
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetConversationGroupName(conversationId));
    }

    public async Task SendMessage(SendMessageRequest request)
    {
        var userId = Context.User!.GetUserId();

        var message = await _messageService.SendMessageAsync(userId, request);

        await Clients
            .Group(GetConversationGroupName(request.ConversationId))
            .SendAsync("ReceiveMessage", message);

        await Clients
            .OthersInGroup(GetConversationGroupName(request.ConversationId))
            .SendAsync("MessageDelivered", new
            {
                MessageId = message.Id,
                ConversationId = message.ConversationId
            });
    }

    public async Task MarkAsRead(Guid conversationId)
    {
        var userId = Context.User!.GetUserId();

        await _messageService.MarkMessagesAsReadAsync(userId, conversationId);

        await Clients
            .OthersInGroup(GetConversationGroupName(conversationId))
            .SendAsync("MessagesRead", new
            {
                ConversationId = conversationId,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            });
    }

    public async Task TypingStarted(Guid conversationId)
    {
        var userId = Context.User!.GetUserId();

        var isMember = await _messageService.IsUserInConversationAsync(
            userId,
            conversationId);

        if (!isMember)
        {
            return;
        }

        await Clients
            .OthersInGroup(GetConversationGroupName(conversationId))
            .SendAsync("UserTypingStarted", new
            {
                ConversationId = conversationId,
                UserId = userId
            });
    }

    public async Task TypingStopped(Guid conversationId)
    {
        var userId = Context.User!.GetUserId();

        var isMember = await _messageService.IsUserInConversationAsync(
            userId,
            conversationId);

        if (!isMember)
        {
            return;
        }

        await Clients
            .OthersInGroup(GetConversationGroupName(conversationId))
            .SendAsync("UserTypingStopped", new
            {
                ConversationId = conversationId,
                UserId = userId
            });
    }

    private static string GetConversationGroupName(Guid conversationId)
    {
        return $"conversation:{conversationId}";
    }
}