import React, { useState } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, X, Globe } from 'lucide-react';
import { Button, Spinner } from './ui';

export interface OfficeLocationValue {
  address: string;
  lat: string;
  lng: string;
  radiusMeters: string;
}

interface OfficeLocationPickerProps {
  value: OfficeLocationValue;
  onChange: (next: OfficeLocationValue) => void;
  allowDisable?: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const PRESET_LOCATIONS = [
  { label: 'Karachi (I.I. Chundrigar)', address: 'I.I. Chundrigar Road, Karachi, Pakistan', lat: '24.8508', lng: '67.0005' },
  { label: 'Karachi (Shahrah-e-Faisal)', address: 'Shahrah-e-Faisal, PECHS, Karachi, Pakistan', lat: '24.8607', lng: '67.0583' },
  { label: 'Lahore (Gulberg III)', address: 'Main Boulevard Gulberg III, Lahore, Pakistan', lat: '31.5102', lng: '74.3441' },
  { label: 'Islamabad (Blue Area)', address: 'Jinnah Avenue, Blue Area, Islamabad, Pakistan', lat: '33.7104', lng: '73.0602' },
  { label: 'Rawalpindi (Saddar)', address: 'Mall Road, Saddar, Rawalpindi, Pakistan', lat: '33.5973', lng: '73.0479' },
];

const RADIUS_PRESETS = [
  { label: '100m (Single Building)', value: '100' },
  { label: '150m (Standard Office)', value: '150' },
  { label: '300m (Tech Park / Campus)', value: '300' },
  { label: '500m (Wide Perimeter)', value: '500' },
];

export const OfficeLocationPicker: React.FC<OfficeLocationPickerProps> = ({
  value,
  onChange,
  allowDisable = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);

  const hasCoordinates = value.lat.trim() !== '' && value.lng.trim() !== '';

  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setSearchError('');
    setResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Location lookup service unavailable.');
      const data: NominatimResult[] = await res.json();
      if (!data || data.length === 0) {
        setSearchError('No matching address found. Try searching by area or city name (e.g., "Clifton Karachi").');
      } else {
        setResults(data);
      }
    } catch {
      setSearchError('Could not reach address directory. You can use GPS detection or select a preset city below.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (r: NominatimResult) => {
    const cleanLat = Number(r.lat).toFixed(4);
    const cleanLng = Number(r.lon).toFixed(4);
    onChange({
      ...value,
      address: r.display_name,
      lat: cleanLat,
      lng: cleanLng,
      radiusMeters: value.radiusMeters || '150',
    });
    setResults([]);
    setSearchQuery('');
    setSearchError('');
  };

  const handleDetectCurrentGps = () => {
    if (!navigator.geolocation) {
      setSearchError('Browser geolocation is not supported on this device.');
      return;
    }

    setDetectingGps(true);
    setSearchError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latStr = pos.coords.latitude.toFixed(4);
        const lngStr = pos.coords.longitude.toFixed(4);
        let resolvedAddress = `Detected Office GPS (${latStr}, ${lngStr})`;

        try {
          const rev = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latStr}&lon=${lngStr}`,
            { headers: { Accept: 'application/json' } }
          );
          if (rev.ok) {
            const revData = await rev.json();
            if (revData?.display_name) {
              resolvedAddress = revData.display_name;
            }
          }
        } catch {
          // Keep fallback label if reverse geocoding is offline
        }

        onChange({
          ...value,
          address: resolvedAddress,
          lat: latStr,
          lng: lngStr,
          radiusMeters: value.radiusMeters || '150',
        });
        setDetectingGps(false);
      },
      () => {
        setDetectingGps(false);
        setSearchError('Location permission denied. Please search your office address or pick a city below.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleDisableGeofence = () => {
    onChange({
      address: '',
      lat: '',
      lng: '',
      radiusMeters: value.radiusMeters || '150',
    });
  };

  return (
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono block">
              Office Geofence Location
            </span>
            <span className="text-[11px] text-zinc-400">
              Search your office address or detect your current location automatically
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Navigation}
            loading={detectingGps}
            onClick={handleDetectCurrentGps}
          >
            {detectingGps ? 'Detecting GPS…' : 'Use Current GPS Location'}
          </Button>
          {allowDisable && hasCoordinates && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisableGeofence}
              className="text-zinc-400 hover:text-rose-300"
            >
              Disable Geofence
            </Button>
          )}
        </div>
      </div>

      {/* Address Search Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchAddress();
                }
              }}
              placeholder="Search office building, street, or city (e.g., Bahria Town Tower Karachi)..."
              className="w-full rounded-xl surface-input pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSearchAddress()}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? <Spinner className="w-3.5 h-3.5" /> : 'Find Address'}
          </Button>
        </div>

        {/* Search Dropdown Results */}
        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
            <div className="px-3 py-1.5 bg-zinc-950 text-[10px] font-mono uppercase text-zinc-400 flex items-center justify-between">
              <span>Select matching office location</span>
              <button
                type="button"
                onClick={() => setResults([])}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-800/80 transition-colors flex items-start gap-2.5"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-zinc-100 truncate">{r.display_name}</div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Coordinates: {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <p className="text-xs text-amber-300 font-medium">{searchError}</p>
        )}

        {/* Quick Business Hub Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">Quick Hubs:</span>
          {PRESET_LOCATIONS.map((preset) => {
            const isSelected =
              value.lat === preset.lat && value.lng === preset.lng;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    address: preset.address,
                    lat: preset.lat,
                    lng: preset.lng,
                    radiusMeters: value.radiusMeters || '150',
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Office Location Display Card */}
      {hasCoordinates ? (
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">
                {value.address || 'Configured Office Perimeter'}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span>Radius: {value.radiusMeters || '150'}m</span>
                <span>•</span>
                <span>
                  GPS: {value.lat}, {value.lng}
                </span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Geofence Active
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400">
          <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>
            Geofencing is currently disabled (Remote / Anywhere Clock-In). Search an address or click a hub above to enable an office perimeter.
          </span>
        </div>
      )}

      {/* Geofence Radius Selector */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300">
            Allowed Clock-In Perimeter Radius
          </label>
          <span className="text-xs font-mono font-bold text-zinc-200">
            {value.radiusMeters || '150'} meters
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RADIUS_PRESETS.map((rp) => {
            const active = String(value.radiusMeters) === rp.value;
            return (
              <button
                key={rp.value}
                type="button"
                onClick={() => onChange({ ...value, radiusMeters: rp.value })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {rp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Advanced Coordinates Section */}
      <div className="pt-1 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
          className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showAdvancedCoords ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showAdvancedCoords ? 'Hide Exact GPS Coordinates' : 'Advanced: View / Edit Exact GPS Coordinates'}</span>
        </button>

        {showAdvancedCoords && (
          <div className="grid sm:grid-cols-3 gap-3 mt-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 block">Office Address Label</label>
              <input
                type="text"
                value={value.address}
                onChange={(e) => onChange({ ...value, address: e.target.value })}
                placeholder="e.g. Head Office, Karachi"
                className="w-full rounded-lg surface-input px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 block">Latitude (-90 to 90)</label>
              <input
                type="number"
                step="0.0001"
                value={value.lat}
                onChange={(e) => onChange({ ...value, lat: e.target.value })}
                placeholder="24.8607"
                className="w-full rounded-lg surface-input px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 block">Longitude (-180 to 180)</label>
              <input
                type="number"
                step="0.0001"
                value={value.lng}
                onChange={(e) => onChange({ ...value, lng: e.target.value })}
                placeholder="67.0011"
                className="w-full rounded-lg surface-input px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

