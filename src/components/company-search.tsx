"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandLoading } from "@/components/ui/command";
import { searchTickers } from "@/lib/stock-api";
import type { TickerSearchResult } from "@/lib/stock-api";
import { useDebounce } from "@/hooks/use-debounce";
import Image from "next/image";
import { Skeleton } from "./ui/skeleton";

interface CompanySearchProps {
  onSearch: (ticker: string) => void;
  isSearching: boolean;
}

export function CompanySearch({ onSearch, isSearching }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerSearchResult>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length > 0) {
      setIsLoading(true);
      const data = await searchTickers(searchQuery);
      setResults(data);
      setIsLoading(false);
    } else {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery, handleSearch]);

  const handleSelect = (ticker: string) => {
    setIsOpen(false);
    setQuery("");
    onSearch(ticker);
  };

  return (
    <Command shouldFilter={false} className="relative overflow-visible">
      <CommandInput
        placeholder="Search for a company..."
        value={query}
        onValueChange={setQuery}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        disabled={isSearching}
      />
      {isOpen && (
        <CommandList className="absolute top-full z-10 mt-1 w-full rounded-md border bg-card text-card-foreground shadow-lg">
          {isLoading ? (
             <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ))}
             </div>
          ) : (
            results.map((item) => (
              <CommandItem key={item.ticker} onSelect={() => handleSelect(item.ticker)} value={item.ticker}>
                <div className="flex items-center gap-4">
                   {item.branding?.logo_url ? (
                    <Image
                      src={item.branding.logo_url}
                      alt={`${item.name} logo`}
                      width={24}
                      height={24}
                      className="rounded-full"
                      unoptimized // As URL contains API key
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                        {item.ticker.slice(0,1)}
                    </div>
                  )}
                  <span className="truncate">{item.name} ({item.ticker})</span>
                </div>
              </CommandItem>
            ))
          )}
          {!isLoading && results.length === 0 && debouncedQuery.length > 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  );
}
