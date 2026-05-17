import { useQuery } from "@tanstack/react-query";
import { conversationsApi } from "../../api/conversationsApi";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.getMyConversations,
  });
}