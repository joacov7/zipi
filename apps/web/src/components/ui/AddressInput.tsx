import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSelection {
  address: string;
  lat: number;
  lng: number;
}

interface AddressInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (result: AddressSelection) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: AddressInputProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ar&addressdetails=0`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es' },
      });
      if (!res.ok) throw new Error('Network error');
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 400);
  };

  const handleSelect = (item: NominatimResult) => {
    onChange(item.display_name);
    onSelect({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          className="input pl-9 pr-9"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((item) => (
            <li key={item.place_id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-zipi-50 hover:text-zipi-700 flex items-start gap-2 transition-colors"
                onMouseDown={(e) => {
                  // Prevent blur from firing before click
                  e.preventDefault();
                  handleSelect(item);
                }}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
