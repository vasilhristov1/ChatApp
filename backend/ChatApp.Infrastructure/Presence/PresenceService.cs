using ChatApp.Application.Presence.Interfaces;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Presence;

public class PresenceService : IPresenceService
{
    private readonly AppDbContext _dbContext;

    public PresenceService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SetUserOnlineAsync(Guid userId)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            return;
        }

        user.IsOnline = true;
        user.LastSeenAt = null;

        await _dbContext.SaveChangesAsync();
    }

    public async Task SetUserOfflineAsync(Guid userId)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            return;
        }

        user.IsOnline = false;
        user.LastSeenAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
    }
}