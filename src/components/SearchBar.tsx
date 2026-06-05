// src/components/SearchBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Identity } from '../models/PermissionNode';

export interface SearchBarProps {
  search: (query: string) => Promise<Identity[]>;
  onSelect: (identity: Identity) => void;
}

export function SearchBar({ search, onSelect }: SearchBarProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Identity[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const skipNextSearch = useRef(false);

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
      try {
        setSuggestions(await search(query));
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, search]);

  return (
    <div className="search-bar">
      <input
        placeholder="Search user or group..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li
              key={s.descriptor}
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
