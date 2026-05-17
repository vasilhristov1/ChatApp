namespace ChatApp.Application.Users.DTOs;

public class UpdateProfileRequest
{
    public string Username { get; set; } = string.Empty;

    public string? Bio { get; set; }
}