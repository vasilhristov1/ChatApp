import * as signalR from "@microsoft/signalr";
import { CHAT_HUB_URL } from "../config";

export function createChatConnection(accessToken: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}