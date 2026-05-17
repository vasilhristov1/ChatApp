using ChatApp.Application.Common.Interfaces;
using FluentValidation;

namespace ChatApp.Infrastructure.Validation;

public class ValidationService : IValidationService
{
    private readonly IServiceProvider _serviceProvider;

    public ValidationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task ValidateAsync<T>(T request)
    {
        var validator = _serviceProvider.GetService(typeof(IValidator<T>)) as IValidator<T>;

        if (validator == null)
        {
            return;
        }

        var result = await validator.ValidateAsync(request);

        if (!result.IsValid)
        {
            var errors = result.Errors
                .Select(x => x.ErrorMessage)
                .ToList();

            throw new ChatApp.Application.Common.Exceptions.ValidationException(errors);
        }
    }
}