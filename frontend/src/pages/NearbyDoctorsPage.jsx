/**
 * NearbyDoctorsPage
 *
 * Interactive map showing hospitals, clinics, and pharmacies near the user.
 * Uses:
 *  - Browser Geolocation API for user position
 *  - Leaflet.js + OpenStreetMap for the map (free, no API key)
 *  - Overpass API for fetching nearby healthcare facilities (free)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue with Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom coloured icons for facility types
const makeIcon = (color) => new L.Icon({
  iconUrl:       `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

const ICONS = {
  hospital: makeIcon('red'),
  clinic:   makeIcon('blue'),
  doctors:  makeIcon('blue'),
  doctor:   makeIcon('blue'),
  pharmacy: makeIcon('green'),
  dentist:  makeIcon('violet'),
  default:  makeIcon('grey'),
};

const TYPE_LABELS = {
  hospital: '🏥 Hospital',
  clinic:   '🏨 Clinic',
  doctors:  '👨‍⚕️ Doctors',
  doctor:   '👨‍⚕️ Doctor',
  pharmacy: '💊 Pharmacy',
  dentist:  '🦷 Dentist',
};

const RADIUS = 5000; // 5 km

// Component to pan map to new center
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// Haversine distance (km)
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Overpass query for healthcare facilities
async function fetchNearby(lat, lon) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(hospital|clinic|doctors|doctor|pharmacy|dentist)$"](around:${RADIUS},${lat},${lon});
      way["amenity"~"^(hospital|clinic|doctors|doctor|pharmacy|dentist)$"](around:${RADIUS},${lat},${lon});
    );
    out center;
  `;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  if (!resp.ok) throw new Error('Overpass API error');
  const json = await resp.json();
  return json.elements.map((el) => ({
    id:      el.id,
    name:    el.tags?.name || 'Unnamed Facility',
    amenity: el.tags?.amenity || 'clinic',
    lat:     el.lat ?? el.center?.lat,
    lon:     el.lon ?? el.center?.lon,
    phone:   el.tags?.phone || el.tags?.['contact:phone'] || null,
    website: el.tags?.website || el.tags?.['contact:website'] || null,
    opening: el.tags?.opening_hours || null,
    address: [
      el.tags?.['addr:housenumber'],
      el.tags?.['addr:street'],
      el.tags?.['addr:city'],
    ].filter(Boolean).join(', ') || null,
  })).filter((p) => p.lat && p.lon);
}

const FILTER_ALL = ['hospital','clinic','doctors','doctor','pharmacy','dentist'];

export default function NearbyDoctorsPage() {
  const [location, setLocation]   = useState(null);
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);

  const locate = useCallback(async () => {
    setLoading(true);
    setError('');
    setPlaces([]);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setLocation([lat, lon]);
      const results = await fetchNearby(lat, lon);
      // Sort by distance
      const sorted = results
        .map((p) => ({ ...p, dist: distance(lat, lon, p.lat, p.lon) }))
        .sort((a, b) => a.dist - b.dist);
      setPlaces(sorted);
      if (sorted.length === 0) setError('No healthcare facilities found within 5 km. Try in a more urban area.');
    } catch (err) {
      if (err.code === 1) setError('Location access denied. Please allow location in your browser settings.');
      else if (err.message?.includes('Overpass')) setError('Map data service is temporarily unavailable. Please try again.');
      else setError('Could not get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-locate on mount
  useEffect(() => { locate(); }, []);

  const filtered = filter === 'all'
    ? places
    : places.filter((p) => p.amenity === filter || (filter === 'doctors' && p.amenity === 'doctor'));

  const defaultCenter = location || [20.5937, 78.9629]; // India center as fallback

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Nearby <span className="gradient-text">Doctors</span>
          </h1>
          <p className="text-slate-400 mt-1.5">
            {places.length > 0
              ? `${places.length} healthcare facilities found within 5 km`
              : 'Finding healthcare facilities near you...'}
          </p>
        </div>
        <button
          onClick={locate}
          disabled={loading}
          className="btn-primary py-2.5"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Locating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Re-locate Me
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'all',      label: 'All' },
          { key: 'hospital', label: '🏥 Hospitals' },
          { key: 'doctors',  label: '👨‍⚕️ Doctors/Clinics' },
          { key: 'pharmacy', label: '💊 Pharmacies' },
          { key: 'dentist',  label: '🦷 Dentists' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-brand-600/30 text-brand-400 border border-brand-500/50'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '62vh' }}>

        {/* Sidebar list */}
        <div className="glass-card overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-slate-400 text-sm">Searching nearby...</p>
              </div>
            </div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <p className="text-slate-500 text-sm">No results for this filter. Click "Re-locate Me" to search.</p>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {filtered.map((place) => (
              <button
                key={place.id}
                onClick={() => setSelected(place)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                  selected?.id === place.id ? 'bg-brand-600/10 border-l-2 border-brand-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_LABELS[place.amenity]?.split(' ')[0] || '🏨'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{place.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {TYPE_LABELS[place.amenity]?.split(' ').slice(1).join(' ') || 'Healthcare'}
                    </p>
                    <p className="text-xs text-brand-400 mt-1 font-medium">
                      📍 {place.dist.toFixed(2)} km away
                    </p>
                    {place.phone && (
                      <p className="text-xs text-slate-500 mt-0.5">📞 {place.phone}</p>
                    )}
                    {place.opening && (
                      <p className="text-xs text-slate-600 mt-0.5 truncate">🕐 {place.opening}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 shadow-card">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && <MapController center={location} />}

            {/* User location */}
            {location && (
              <>
                <Circle
                  center={location}
                  radius={RADIUS}
                  pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1 }}
                />
                <Marker
                  position={location}
                  icon={makeIcon('gold')}
                >
                  <Popup>
                    <strong>📍 You are here</strong>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Healthcare markers */}
            {filtered.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lon]}
                icon={ICONS[place.amenity] || ICONS.default}
                eventHandlers={{ click: () => setSelected(place) }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>{place.name}</p>
                    <p style={{ fontSize: 12, color: '#666' }}>
                      {TYPE_LABELS[place.amenity] || place.amenity}
                    </p>
                    <p style={{ fontSize: 12, color: '#4f46e5', marginTop: 4 }}>
                      📍 {place.dist?.toFixed(2)} km
                    </p>
                    {place.phone && <p style={{ fontSize: 12, marginTop: 2 }}>📞 {place.phone}</p>}
                    {place.address && <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{place.address}</p>}
                    {place.website && (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: '#4f46e5', display: 'block', marginTop: 4 }}
                      >
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        <span>🔴 Hospital</span>
        <span>🔵 Clinic / Doctor</span>
        <span>🟢 Pharmacy</span>
        <span>🟣 Dentist</span>
        <span>⭐ Your Location</span>
      </div>
    </main>
  );
}
