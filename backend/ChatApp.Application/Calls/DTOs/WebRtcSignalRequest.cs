namespace ChatApp.Application.Calls.DTOs;

public class WebRtcSignalRequest
{
    public Guid CallId { get; set; }
    public Guid TargetUserId { get; set; }
    public string Data { get; set; } = string.Empty;
}