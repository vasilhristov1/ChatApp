FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ChatApp.sln .
COPY ChatApp.Api/ChatApp.Api.csproj ChatApp.Api/
COPY ChatApp.Application/ChatApp.Application.csproj ChatApp.Application/
COPY ChatApp.Domain/ChatApp.Domain.csproj ChatApp.Domain/
COPY ChatApp.Infrastructure/ChatApp.Infrastructure.csproj ChatApp.Infrastructure/

RUN dotnet restore ChatApp.sln

COPY . .
RUN dotnet publish ChatApp.Api/ChatApp.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "ChatApp.Api.dll"]