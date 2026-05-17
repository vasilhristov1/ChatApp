using ChatApp.Api.Extensions;
using ChatApp.Application.Calls.DTOs;
using ChatApp.Application.Calls.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Api.Hubs;

[Authorize]
public class CallHub : Hub
{
    private readonly ICallService _callService;

    public CallHub(ICallService callService)
    {
        _callService = callService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();

        await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroupName(userId));

        await base.OnConnectedAsync();
    }

    public async Task StartCall(StartCallRequest request)
    {
        var callerId = Context.User!.GetUserId();

        var call = await _callService.StartCallAsync(callerId, request);

        await Clients
            .Group(GetUserGroupName(request.ReceiverId))
            .SendAsync("IncomingCall", call);

        await Clients
            .Caller
            .SendAsync("CallStarted", call);
    }

    public async Task AcceptCall(Guid callId)
    {
        var userId = Context.User!.GetUserId();

        var call = await _callService.AcceptCallAsync(userId, callId);

        await Clients
            .Group(GetUserGroupName(call.CallerId))
            .SendAsync("CallAccepted", call);

        await Clients
            .Caller
            .SendAsync("CallAccepted", call);
    }

    public async Task RejectCall(Guid callId)
    {
        var userId = Context.User!.GetUserId();

        var call = await _callService.RejectCallAsync(userId, callId);

        await Clients
            .Group(GetUserGroupName(call.CallerId))
            .SendAsync("CallRejected", call);

        await Clients
            .Caller
            .SendAsync("CallRejected", call);
    }

    public async Task EndCall(Guid callId)
    {
        var userId = Context.User!.GetUserId();

        var call = await _callService.EndCallAsync(userId, callId);

        if (call.ReceiverId.HasValue)
        {
            await Clients
                .Group(GetUserGroupName(call.ReceiverId.Value))
                .SendAsync("CallEnded", call);
        }

        await Clients
            .Group(GetUserGroupName(call.CallerId))
            .SendAsync("CallEnded", call);
    }

    public async Task SendOffer(WebRtcSignalRequest request)
    {
        await EnsureCanAccessCall(request.CallId);

        await Clients
            .Group(GetUserGroupName(request.TargetUserId))
            .SendAsync("ReceiveOffer", request);
    }

    public async Task SendAnswer(WebRtcSignalRequest request)
    {
        await EnsureCanAccessCall(request.CallId);

        await Clients
            .Group(GetUserGroupName(request.TargetUserId))
            .SendAsync("ReceiveAnswer", request);
    }

    public async Task SendIceCandidate(WebRtcSignalRequest request)
    {
        await EnsureCanAccessCall(request.CallId);

        await Clients
            .Group(GetUserGroupName(request.TargetUserId))
            .SendAsync("ReceiveIceCandidate", request);
    }

    private async Task EnsureCanAccessCall(Guid callId)
    {
        var userId = Context.User!.GetUserId();

        var canAccess = await _callService.CanAccessCallAsync(userId, callId);

        if (!canAccess)
        {
            throw new HubException("You cannot access this call.");
        }
    }

    private static string GetUserGroupName(Guid userId)
    {
        return $"user:{userId}";
    }
}