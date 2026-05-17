using ChatApp.Api.Extensions;
using ChatApp.Application.Calls.DTOs;
using ChatApp.Application.Calls.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public class CallsController : ControllerBase
{
    private readonly ICallService _callService;

    public CallsController(ICallService callService)
    {
        _callService = callService;
    }

    [HttpPost("start")]
    public async Task<ActionResult<CallResponse>> StartCall(StartCallRequest request)
    {
        var userId = User.GetUserId();

        var call = await _callService.StartCallAsync(userId, request);

        return Ok(call);
    }

    [HttpPost("{callId:guid}/accept")]
    public async Task<ActionResult<CallResponse>> AcceptCall(Guid callId)
    {
        var userId = User.GetUserId();

        var call = await _callService.AcceptCallAsync(userId, callId);

        return Ok(call);
    }

    [HttpPost("{callId:guid}/reject")]
    public async Task<ActionResult<CallResponse>> RejectCall(Guid callId)
    {
        var userId = User.GetUserId();

        var call = await _callService.RejectCallAsync(userId, callId);

        return Ok(call);
    }

    [HttpPost("{callId:guid}/end")]
    public async Task<ActionResult<CallResponse>> EndCall(Guid callId)
    {
        var userId = User.GetUserId();

        var call = await _callService.EndCallAsync(userId, callId);

        return Ok(call);
    }
}