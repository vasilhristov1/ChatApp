import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://localhost:7039/hubs/call";

export function createCallConnection(accessToken: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}