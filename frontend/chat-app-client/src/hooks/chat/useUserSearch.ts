import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../../api/usersApi";

export function useUserSearch(query: string) {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: ["user-search", trimmedQuery],
    queryFn: () => usersApi.searchUsers(trimmedQuery),
    enabled: trimmedQuery.length > 0,
  });
}