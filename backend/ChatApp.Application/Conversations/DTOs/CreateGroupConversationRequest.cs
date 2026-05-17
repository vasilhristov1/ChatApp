namespace ChatApp.Application.Conversations.DTOs;

public class CreateGroupConversationRequest
{
    public string Name { get; set; } = string.Empty;
    public List<Guid> MemberIds { get; set; } = new();
}