using ChatApp.Api.Extensions;
using ChatApp.Application.Conversations.DTOs;
using ChatApp.Application.Conversations.Interfaces;
using ChatApp.Application.Messages.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _conversationService;

    public ConversationsController(IConversationService conversationService)
    {
        _conversationService = conversationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ConversationResponse>>> GetMyConversations()
    {
        var userId = User.GetUserId();

        var conversations = await _conversationService.GetMyConversationsAsync(userId);

        return Ok(conversations);
    }

    [HttpGet("{conversationId:guid}")]
    public async Task<ActionResult<ConversationResponse>> GetConversationById(Guid conversationId)
    {
        var userId = User.GetUserId();

        var conversation = await _conversationService.GetConversationByIdAsync(userId, conversationId);

        return Ok(conversation);
    }

    [HttpPost("direct")]
    public async Task<ActionResult<ConversationResponse>> CreateDirectConversation(
        CreateDirectConversationRequest request)
    {
        var userId = User.GetUserId();

        var conversation = await _conversationService.CreateDirectConversationAsync(userId, request);

        return Ok(conversation);
    }

    [HttpPost("group")]
    public async Task<ActionResult<ConversationResponse>> CreateGroupConversation(
        CreateGroupConversationRequest request)
    {
        var userId = User.GetUserId();

        var conversation = await _conversationService.CreateGroupConversationAsync(userId, request);

        return Ok(conversation);
    }

    [HttpGet("{conversationId:guid}/messages")]
    public async Task<ActionResult<List<MessageResponse>>> GetMessages(
        Guid conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = User.GetUserId();

        var messages = await _conversationService.GetMessagesAsync(
            userId,
            conversationId,
            page,
            pageSize);

        return Ok(messages);
    }
}