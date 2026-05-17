using ChatApp.Domain.Enums;

namespace ChatApp.Application.Calls.DTOs;

public class CallResponse
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Guid CallerId { get; set; }

    public string CallerUsername { get; set; } = string.Empty;

    public Guid? ReceiverId { get; set; }

    public string? ReceiverUsername { get; set; }

    public CallStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? AcceptedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public int? DurationInSeconds { get; set; }
}