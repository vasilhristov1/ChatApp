using ChatApp.Domain.Entities;

namespace ChatApp.Application.Auth.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);

    string GenerateRefreshToken();
}