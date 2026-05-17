using ChatApp.Application.Calls.DTOs;

namespace ChatApp.Application.Calls.Interfaces;

public interface ICallService
{
    Task<CallResponse> StartCallAsync(Guid callerId, StartCallRequest request);

    Task<CallResponse> AcceptCallAsync(Guid userId, Guid callId);

    Task<CallResponse> RejectCallAsync(Guid userId, Guid callId);

    Task<CallResponse> EndCallAsync(Guid userId, Guid callId);

    Task<bool> CanAccessCallAsync(Guid userId, Guid callId);
}