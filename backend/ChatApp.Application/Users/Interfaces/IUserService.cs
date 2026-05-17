using ChatApp.Application.Auth.DTOs;
using ChatApp.Application.Users.DTOs;

namespace ChatApp.Application.Users.Interfaces;

public interface IUserService
{
    Task<List<UserSearchResponse>> SearchUsersAsync(Guid currentUserId, string searchTerm);
    Task<CurrentUserResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<CurrentUserResponse> UploadAvatarAsync(Guid userId, string avatarUrl);
}