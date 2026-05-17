import * as signalR from "@microsoft/signalr";
import { CALL_HUB_URL } from "../config";

export function createCallConnection(accessToken: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(CALL_HUB_URL, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}