using ChatApp.Application.Auth.DTOs;

namespace ChatApp.Application.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);

    Task<AuthResponse> LoginAsync(LoginRequest request);

    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);

    Task<CurrentUserResponse> GetCurrentUserAsync(Guid userId);
}