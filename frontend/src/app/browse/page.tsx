"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useListings, type SearchFilters } from "@/hooks/useListings";
import { CATEGORIES, getCategoryLabel } from "@/lib/categories";

function formatValue(val: string) {
  return Number(BigInt(val) / 1000000n).toLocaleString();
}

export default function BrowsePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SearchFilters["sort"]>("newest");
  const [page, setPage] = useState(1);

  const filters: SearchFilters = {
    q: q || undefined,
    category: category || undefined,
    sort,
    page,
    limit: 12,
  };

  const { listings, total, isLoading } = useListings(filters);
  const totalPages = Math.ceil(total / 12);

  return (
    <>
      <Header />

      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Browse Listings
          </h1>
          <p className="mt-1 text-gray-500">
            Discover assets available for sealed negotiation
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by keyword..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="input flex-1 min-w-[200px]"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SearchFilters["sort"])}
            className="input w-auto"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-500">No listings found</p>
            <p className="text-gray-400 text-sm mt-1">
              {q || category
                ? "Try adjusting your search filters"
                : "Be the first to list an asset"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {total} listing{total !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/trade/${l.tradeId}`}
                  className="group rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {getCategoryLabel(l.category)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {l.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {l.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      ${formatValue(l.maxDealValue)} USDC
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(l.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {l.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
