using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Conversation : BaseEntity
{
    public ConversationType Type { get; set; }

    public string? Name { get; set; }

    public string? ImageUrl { get; set; }

    public ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();

    public ICollection<Message> Messages { get; set; } = new List<Message>();

    public ICollection<Call> Calls { get; set; } = new List<Call>();
}