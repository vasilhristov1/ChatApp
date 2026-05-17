namespace ChatApp.Application.Calls.DTOs;

public class StartCallRequest
{
    public Guid ConversationId { get; set; }

    public Guid ReceiverId { get; set; }
}