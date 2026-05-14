"use client";

import { useState, useEffect } from "react";

export interface ListingMetadata {
  id: string;
  tradeId: string;
  assetHash: string;
  sellerAddress: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  maxDealValue: string;
  deadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useListing(tradeId: string | undefined) {
  const [listing, setListing] = useState<ListingMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    let cancelled = false;

    async function fetchListing() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/listings/${tradeId}`);
        if (!res.ok) {
          setListing(null);
          return;
        }
        const json = await res.json();
        if (!cancelled && json.success) {
          setListing(json.data);
        }
      } catch {
        if (!cancelled) setListing(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchListing();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  return { listing, isLoading };
}
