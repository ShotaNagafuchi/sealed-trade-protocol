"use client";

import { useState, useEffect, useCallback } from "react";
import type { ListingMetadata } from "./useListing";

export interface SearchFilters {
  q?: string;
  category?: string;
  tags?: string;
  minPrice?: string;
  maxPrice?: string;
  seller?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface ListingsResult {
  listings: ListingMetadata[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  refetch: () => void;
}

export function useListings(filters: SearchFilters): ListingsResult {
  const [listings, setListings] = useState<ListingMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;

    async function doFetch() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        const f: SearchFilters = JSON.parse(filtersKey);
        if (f.q) params.set("q", f.q);
        if (f.category) params.set("category", f.category);
        if (f.tags) params.set("tags", f.tags);
        if (f.minPrice) params.set("minPrice", f.minPrice);
        if (f.maxPrice) params.set("maxPrice", f.maxPrice);
        if (f.seller) params.set("seller", f.seller);
        if (f.sort) params.set("sort", f.sort);
        if (f.page) params.set("page", String(f.page));
        if (f.limit) params.set("limit", String(f.limit));

        const res = await fetch(`/api/listings?${params.toString()}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setListings(json.data);
          setTotal(json.meta.total);
        }
      } catch {
        if (!cancelled) {
          setListings([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    doFetch();
    return () => { cancelled = true; };
  }, [filtersKey, fetchCount]);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  return {
    listings,
    total,
    page: filters.page || 1,
    limit: filters.limit || 20,
    isLoading,
    refetch,
  };
}
