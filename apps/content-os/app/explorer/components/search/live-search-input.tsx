"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  isSearching?: boolean;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Live search input with suggestions dropdown
 */
export function LiveSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search videos...",
  suggestions = [],
  isSearching = false,
  className,
  autoFocus = false,
}: LiveSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showSuggestions = isFocused && suggestions.length > 0;

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) {
        if (event.key === "Enter" && onSearch) {
          onSearch(value);
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onChange(suggestions[selectedIndex]);
            onSearch?.(suggestions[selectedIndex]);
          } else if (onSearch) {
            onSearch(value);
          }
          setIsFocused(false);
          break;
        case "Escape":
          setIsFocused(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, value, onChange, onSearch]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      onSearch?.(suggestion);
      setIsFocused(false);
      inputRef.current?.focus();
    },
    [onChange, onSearch]
  );

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {/* Search icon or loading spinner */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoFocus={autoFocus}
        />

        {/* Clear button */}
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="flex items-center gap-2">
                <Search className="h-3 w-3 text-muted-foreground" />
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
