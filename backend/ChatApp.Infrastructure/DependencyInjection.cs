using ChatApp.Application.Auth.Interfaces;
using ChatApp.Application.Auth.Settings;
using ChatApp.Application.Auth.Validators;
using ChatApp.Application.Calls.Interfaces;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Conversations.Interfaces;
using ChatApp.Application.Messages.Interfaces;
using ChatApp.Application.Presence.Interfaces;
using ChatApp.Application.Users.Interfaces;
using ChatApp.Infrastructure.Auth;
using ChatApp.Infrastructure.Calls;
using ChatApp.Infrastructure.Conversations;
using ChatApp.Infrastructure.Messages;
using ChatApp.Infrastructure.Persistence;
using ChatApp.Infrastructure.Presence;
using ChatApp.Infrastructure.Users;
using ChatApp.Infrastructure.Validation;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChatApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });
        
        services.Configure<JwtSettings>(
            configuration.GetSection("Jwt"));
        
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<IPresenceService, PresenceService>();
        services.AddScoped<ICallService, CallService>();
        
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        services.AddScoped<IValidationService, ValidationService>();

        return services;
    }
}