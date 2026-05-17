import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://localhost:7039/hubs/chat";

export function createChatConnection(accessToken: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}