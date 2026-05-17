using ChatApp.Application.Auth.DTOs;
using ChatApp.Application.Auth.Interfaces;
using ChatApp.Application.Auth.Settings;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtSettings _jwtSettings;
    private readonly IValidationService _validationService;

    public AuthService(
        AppDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IOptions<JwtSettings> jwtOptions,
        IValidationService validationService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _jwtSettings = jwtOptions.Value;
        _validationService = validationService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        await _validationService.ValidateAsync(request);
        
        var email = request.Email.Trim().ToLower();
        var username = request.Username.Trim();

        if (await _dbContext.Users.AnyAsync(x => x.Email.ToLower() == email))
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        if (await _dbContext.Users.AnyAsync(x => x.Username.ToLower() == username.ToLower()))
        {
            throw new InvalidOperationException("Username is already taken.");
        }

        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);

        await _dbContext.SaveChangesAsync();

        var refreshToken = CreateRefreshToken(user);

        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync();

        return CreateAuthResponse(user, refreshToken.Token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        await _validationService.ValidateAsync(request);
        
        var login = request.EmailOrUsername.Trim().ToLower();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(x =>
                x.Email.ToLower() == login ||
                x.Username.ToLower() == login);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var passwordIsValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!passwordIsValid)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var refreshToken = CreateRefreshToken(user);

        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync();

        return CreateAuthResponse(user, refreshToken.Token);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        await _validationService.ValidateAsync(request);
        
        var user = await _dbContext.Users
            .Include(x => x.RefreshTokens)
            .FirstOrDefaultAsync(x =>
                x.RefreshTokens.Any(t => t.Token == request.RefreshToken));

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var oldToken = user.RefreshTokens
            .First(x => x.Token == request.RefreshToken);

        if (!oldToken.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token is no longer active.");
        }

        oldToken.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = CreateRefreshToken(user);

        user.RefreshTokens.Add(newRefreshToken);

        await _dbContext.SaveChangesAsync();

        return CreateAuthResponse(user, newRefreshToken.Token);
    }

    public async Task<CurrentUserResponse> GetCurrentUserAsync(Guid userId)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found.");
        }

        return new CurrentUserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio
        };
    }

    private RefreshToken CreateRefreshToken(User user)
    {
        return new RefreshToken
        {
            UserId = user.Id,
            Token = _jwtTokenService.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };
    }

    private AuthResponse CreateAuthResponse(User user, string refreshToken)
    {
        return new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            AccessToken = _jwtTokenService.GenerateAccessToken(user),
            RefreshToken = refreshToken
        };
    }
}