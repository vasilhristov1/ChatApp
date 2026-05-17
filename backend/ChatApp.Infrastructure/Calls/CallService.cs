using ChatApp.Application.Calls.DTOs;
using ChatApp.Application.Calls.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Calls;

public class CallService : ICallService
{
    private readonly AppDbContext _dbContext;

    public CallService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CallResponse> StartCallAsync(Guid callerId, StartCallRequest request)
    {
        if (callerId == request.ReceiverId)
        {
            throw new InvalidOperationException("You cannot call yourself.");
        }

        var isCallerMember = await _dbContext.ConversationMembers
            .AnyAsync(x =>
                x.ConversationId == request.ConversationId &&
                x.UserId == callerId);

        var isReceiverMember = await _dbContext.ConversationMembers
            .AnyAsync(x =>
                x.ConversationId == request.ConversationId &&
                x.UserId == request.ReceiverId);

        if (!isCallerMember || !isReceiverMember)
        {
            throw new UnauthorizedAccessException("Both users must be members of the conversation.");
        }

        var call = new Call
        {
            ConversationId = request.ConversationId,
            CallerId = callerId,
            ReceiverId = request.ReceiverId,
            Status = CallStatus.Ringing,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Calls.Add(call);

        await _dbContext.SaveChangesAsync();

        return await GetCallResponseAsync(call.Id);
    }

    public async Task<CallResponse> AcceptCallAsync(Guid userId, Guid callId)
    {
        var call = await _dbContext.Calls.FirstOrDefaultAsync(x => x.Id == callId);

        if (call == null)
        {
            throw new KeyNotFoundException("Call not found.");
        }

        if (call.ReceiverId != userId)
        {
            throw new UnauthorizedAccessException("Only the receiver can accept this call.");
        }

        if (call.Status != CallStatus.Ringing)
        {
            throw new InvalidOperationException("This call can no longer be accepted.");
        }

        call.Status = CallStatus.Accepted;
        call.AcceptedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetCallResponseAsync(call.Id);
    }

    public async Task<CallResponse> RejectCallAsync(Guid userId, Guid callId)
    {
        var call = await _dbContext.Calls.FirstOrDefaultAsync(x => x.Id == callId);

        if (call == null)
        {
            throw new KeyNotFoundException("Call not found.");
        }

        if (call.ReceiverId != userId)
        {
            throw new UnauthorizedAccessException("Only the receiver can reject this call.");
        }

        if (call.Status != CallStatus.Ringing)
        {
            throw new InvalidOperationException("This call can no longer be rejected.");
        }

        call.Status = CallStatus.Rejected;
        call.EndedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetCallResponseAsync(call.Id);
    }

    public async Task<CallResponse> EndCallAsync(Guid userId, Guid callId)
    {
        var call = await _dbContext.Calls.FirstOrDefaultAsync(x => x.Id == callId);

        if (call == null)
        {
            throw new KeyNotFoundException("Call not found.");
        }

        if (call.CallerId != userId && call.ReceiverId != userId)
        {
            throw new UnauthorizedAccessException("You cannot end this call.");
        }

        if (call.Status is CallStatus.Ended or CallStatus.Rejected or CallStatus.Missed)
        {
            throw new InvalidOperationException("This call has already ended.");
        }

        call.Status = CallStatus.Ended;
        call.EndedAt = DateTime.UtcNow;

        if (call.AcceptedAt.HasValue)
        {
            call.DurationInSeconds = (int)(call.EndedAt.Value - call.AcceptedAt.Value).TotalSeconds;
        }

        await _dbContext.SaveChangesAsync();

        return await GetCallResponseAsync(call.Id);
    }

    public async Task<bool> CanAccessCallAsync(Guid userId, Guid callId)
    {
        return await _dbContext.Calls
            .AnyAsync(x =>
                x.Id == callId &&
                (x.CallerId == userId || x.ReceiverId == userId));
    }

    private async Task<CallResponse> GetCallResponseAsync(Guid callId)
    {
        var call = await _dbContext.Calls
            .AsNoTracking()
            .Include(x => x.Caller)
            .Include(x => x.Receiver)
            .FirstAsync(x => x.Id == callId);

        return new CallResponse
        {
            Id = call.Id,
            ConversationId = call.ConversationId,
            CallerId = call.CallerId,
            CallerUsername = call.Caller.Username,
            ReceiverId = call.ReceiverId,
            ReceiverUsername = call.Receiver?.Username,
            Status = call.Status,
            CreatedAt = call.CreatedAt,
            AcceptedAt = call.AcceptedAt,
            EndedAt = call.EndedAt,
            DurationInSeconds = call.DurationInSeconds
        };
    }
}