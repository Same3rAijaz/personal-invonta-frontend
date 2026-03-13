import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPublicFavorites, togglePublicFavorite } from "../api/public";
import { useMarketplaceAuth } from "./useMarketplaceAuth";
import { useToast } from "./useToast";

export function useFavorites() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useMarketplaceAuth();
  const { notify } = useToast();

  const { data: favorites = [], isLoading, isFetching } = useQuery({
    queryKey: ["public-favorites"],
    queryFn: () => listPublicFavorites(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: string) => togglePublicFavorite(productId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["public-favorites"] });
      notify(res.favorited ? "Added to favorites" : "Removed from favorites", "success");
    },
    onError: () => {
      notify(isAuthenticated ? "Failed to update favorites" : "Please sign in to add favorites", "warning");
    }
  });

  const isFavorited = React.useCallback(
    (productId: string) => {
      return favorites.some((fav: any) => String(fav._id) === String(productId));
    },
    [favorites]
  );

  const toggle = React.useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        notify("Please sign in to add favorites", "warning");
        return;
      }
      toggleMutation.mutate(productId);
    },
    [isAuthenticated, toggleMutation, notify]
  );

  return {
    favorites: isAuthenticated ? favorites : [],
    isLoading,
    isFetching,
    isFavorited,
    toggle,
    isToggling: toggleMutation.isPending
  };
}
