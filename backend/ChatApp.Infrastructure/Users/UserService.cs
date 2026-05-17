using ChatApp.Application.Auth.DTOs;
using ChatApp.Application.Users.DTOs;
using ChatApp.Application.Users.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Users;

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<UserSearchResponse>> SearchUsersAsync(Guid currentUserId, string searchTerm)
    {
        searchTerm = searchTerm.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return new List<UserSearchResponse>();
        }

        return await _dbContext.Users
            .AsNoTracking()
            .Where(x =>
                x.Id != currentUserId &&
                (
                    x.Username.ToLower().Contains(searchTerm) ||
                    x.Email.ToLower().Contains(searchTerm)
                ))
            .OrderBy(x => x.Username)
            .Take(20)
            .Select(x => new UserSearchResponse
            {
                Id = x.Id,
                Username = x.Username,
                Email = x.Email,
                AvatarUrl = x.AvatarUrl,
                IsOnline = x.IsOnline,
                LastSeenAt = x.LastSeenAt
            })
            .ToListAsync();
    }
    
    public async Task<CurrentUserResponse> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var username = request.Username.Trim();

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new InvalidOperationException("Username is required.");
        }

        var usernameExists = await _dbContext.Users.AnyAsync(x =>
            x.Id != userId &&
            x.Username.ToLower() == username.ToLower());

        if (usernameExists)
        {
            throw new InvalidOperationException("Username is already taken.");
        }

        user.Username = username;
        user.Bio = request.Bio?.Trim();

        await _dbContext.SaveChangesAsync();

        return MapCurrentUser(user);
    }

    public async Task<CurrentUserResponse> UploadAvatarAsync(
        Guid userId,
        string avatarUrl)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.AvatarUrl = avatarUrl;

        await _dbContext.SaveChangesAsync();

        return MapCurrentUser(user);
    }

    private static CurrentUserResponse MapCurrentUser(User user)
    {
        return new CurrentUserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio
        };
    }
}