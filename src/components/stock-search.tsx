"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  initialTicker: string;
  isSearching: boolean;
}

export function StockSearch({ onSearch, initialTicker, isSearching }: StockSearchProps) {
  const [ticker, setTicker] = useState(initialTicker);

  const handleSearchClick = () => {
    if (ticker.trim()) {
      onSearch(ticker.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearchClick();
    }
  };

  return (
    <div className="relative ml-auto flex-1 md:grow-0">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Enter stock ticker..."
        className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        aria-label="Stock Ticker Search"
      />
      <Button 
        size="sm" 
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
        onClick={handleSearchClick}
        disabled={isSearching}
        aria-label="Search Stock"
      >
        {isSearching ? "..." : "Search"}
      </Button>
    </div>
  );
}
