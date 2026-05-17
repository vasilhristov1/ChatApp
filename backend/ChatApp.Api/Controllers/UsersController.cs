using ChatApp.Api.Extensions;
using ChatApp.Application.Auth.DTOs;
using ChatApp.Application.Users.DTOs;
using ChatApp.Application.Users.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<UserSearchResponse>>> SearchUsers(
        [FromQuery] string query)
    {
        var currentUserId = User.GetUserId();

        var users = await _userService.SearchUsersAsync(currentUserId, query);

        return Ok(users);
    }
    
    [HttpPut("me")]
    public async Task<ActionResult<CurrentUserResponse>> UpdateProfile(
        UpdateProfileRequest request)
    {
        var userId = User.GetUserId();

        var user = await _userService.UpdateProfileAsync(userId, request);

        return Ok(user);
    }

    [HttpPost("me/avatar")]
    [RequestSizeLimit(5_000_000)]
    public async Task<ActionResult<CurrentUserResponse>> UploadAvatar(
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new InvalidOperationException("Avatar file is required.");
        }

        var allowedContentTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
        }

        var uploadsFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "uploads",
            "avatars");

        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName);
        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, safeFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var avatarUrl = $"/uploads/avatars/{safeFileName}";

        var userId = User.GetUserId();

        var user = await _userService.UploadAvatarAsync(userId, avatarUrl);

        return Ok(user);
    }
}