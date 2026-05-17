using System.Net;
using System.Text.Json;
using ChatApp.Application.Common;
using ChatApp.Application.Common.Exceptions;

namespace ChatApp.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception occurred.");

        var response = exception switch
        {
            ValidationException validationException => new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = validationException.Message,
                Errors = validationException.Errors
            },

            UnauthorizedAccessException => new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status401Unauthorized,
                Message = exception.Message
            },

            InvalidOperationException => new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = exception.Message
            },

            KeyNotFoundException => new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status404NotFound,
                Message = exception.Message
            },

            _ => new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status500InternalServerError,
                Message = _environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred."
            }
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = response.StatusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}