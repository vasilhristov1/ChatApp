namespace ChatApp.Application.Presence.Interfaces;

public interface IPresenceService
{
    Task SetUserOnlineAsync(Guid userId);

    Task SetUserOfflineAsync(Guid userId);
}