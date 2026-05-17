namespace ChatApp.Application.Common.Interfaces;

public interface IValidationService
{
    Task ValidateAsync<T>(T request);
}