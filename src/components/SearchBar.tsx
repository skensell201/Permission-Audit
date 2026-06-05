// src/components/SearchBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Identity } from '../models/PermissionNode';

export interface SearchBarProps {
  search: (query: string) => Promise<Identity[]>;
  onSelect: (identity: Identity) => void;
  /** Fired whenever the user edits the query — any previous selection is no longer valid. */
  onClear?: () => void;
}

export function SearchBar({ search, onSelect, onClear }: SearchBarProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Identity[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const skipNextSearch = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const result = await search(query);
        if (id === requestId.current) setSuggestions(result);
      } catch {
        if (id === requestId.current) setSuggestions([]);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, search]);

  return (
    <div className="search-bar">
      <input
        role="combobox"
        aria-label="Search user or group"
        aria-expanded={suggestions.length > 0}
        placeholder="Search user or group..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onClear?.();
        }}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.map((s) => (
            <li
              key={s.descriptor}
              role="option"
              aria-selected={false}
              onClick={() => {
                onSelect(s);
                skipNextSearch.current = true;
                setQuery(s.displayName);
                setSuggestions([]);
              }}
            >
              <span className={s.isGroup ? 'badge badge-group' : 'badge badge-user'}>
                {s.isGroup ? 'GROUP' : 'USER'}
              </span>
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
