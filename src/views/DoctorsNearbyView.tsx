import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { MapContainer, TileLayer, Marker, Popup, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { SectionHero } from '../components/ui/SectionHero';
import { DoctorFinderIllustration } from '../components/ContextualIllustrations';
import { PortalModal } from '../components/ui/PortalModal';
import { SafeMarkdown } from '../components/ui/SafeMarkdown';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { FavoritePlace, GoogleMapsGroundingSource } from '../types';
import {
  getBrowserCurrentPosition,
  reverseGeocodeCoordinates,
  forwardGeocodeLocation,
  calculateHaversineDistanceKm,
  UserGeoLocation
} from '../services/locationService';
import { aiClient } from '../services/aiClient';
import { favoritesService } from '../services/favoritesService';
import {
  Stethoscope,
  MapPin,
  Search,
  Compass,
  RefreshCw,
  AlertCircle,
  Building2,
  Star,
  Phone,
  ExternalLink,
  Heart,
  Calendar,
  Sparkles,
  ShieldAlert,
  BookmarkCheck,
  Navigation,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
const HAS_GOOGLE_MAPS = Boolean(GOOGLE_MAPS_API_KEY);

type CareCategory = 'all' | 'hospital' | 'clinic' | 'doctor' | 'pharmacy';

interface RealCarePlace {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  phone?: string;
  mapsUrl: string;
}

const DEFAULT_LOCATION: UserGeoLocation = {
  latitude: 28.6139,
  longitude: 77.209,
  locationName: 'New Delhi, India',
  city: 'New Delhi',
  state: 'Delhi',
  isManual: true
};

const QUICK_CITIES = [
  { label: 'New Delhi', query: 'Connaught Place, New Delhi' },
  { label: 'Gurugram', query: 'Gurugram, Haryana' },
  { label: 'Mumbai', query: 'Bandra, Mumbai' },
  { label: 'Bengaluru', query: 'Bengaluru, Karnataka' },
  { label: 'Pune', query: 'Pune, Maharashtra' },
  { label: 'Hyderabad', query: 'Hyderabad, Telangana' },
  { label: 'Chennai', query: 'Chennai, Tamil Nadu' }
];

const CATEGORY_OPTIONS: Array<{ id: CareCategory; label: string; googleTypes: string[]; osmFilter: string }> = [
  {
    id: 'all',
    label: 'All Healthcare',
    googleTypes: ['hospital', 'doctor', 'pharmacy'],
    osmFilter: 'hospital|clinic|doctors|pharmacy'
  },
  {
    id: 'hospital',
    label: 'Hospital',
    googleTypes: ['hospital'],
    osmFilter: 'hospital'
  },
  {
    id: 'clinic',
    label: 'Clinic',
    googleTypes: ['medical_lab', 'doctor', 'hospital'],
    osmFilter: 'clinic'
  },
  {
    id: 'doctor',
    label: 'Doctor',
    googleTypes: ['doctor'],
    osmFilter: 'doctors'
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    googleTypes: ['pharmacy'],
    osmFilter: 'pharmacy'
  }
];

function isQuotaError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err || '');
  return /429|RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|quota/i.test(text);
}

function getLocalTomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeLeafletPinIcon(color: string, active: boolean) {
  const size = active ? 32 : 24;
  return L.divIcon({
    className: 'healyaar-leaflet-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 3px 10px rgba(15,23,42,0.35);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// ============================================================================
// GOOGLE MAPS EXPERIENCE (Mounted ONLY when VITE_GOOGLE_MAPS_API_KEY is present)
// Uses @vis.gl/react-google-maps + Places API (New) + Gemini Grounding with Google Maps
// ============================================================================
interface GoogleCareMapProps {
  center: { lat: number; lng: number };
  category: CareCategory;
  radiusKm: number;
  keyword: string;
  searchNonce: number;
  selectedPlaceId: string | null;
  onSelectPlace: (place: RealCarePlace | null) => void;
  onPlacesLoaded: (places: RealCarePlace[], loading: boolean, error: string | null) => void;
}

const GoogleCareMapController: React.FC<GoogleCareMapProps> = ({
  center,
  category,
  radiusKm,
  keyword,
  searchNonce,
  selectedPlaceId,
  onSelectPlace,
  onPlacesLoaded
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState<RealCarePlace[]>([]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  // Pan map when user location changes
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng]);

  // Pan map when a list card is clicked
  useEffect(() => {
    if (map && selectedPlace) {
      map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    }
  }, [map, selectedPlace]);

  // Search real facilities via Places API (New) — NEVER legacy PlacesService
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const runSearch = async () => {
      onPlacesLoaded([], true, null);
      try {
        const PlaceClass = (placesLib as unknown as {
          Place: {
            searchNearby: (req: Record<string, unknown>) => Promise<{ places?: Array<Record<string, unknown>> }>;
            searchByText: (req: Record<string, unknown>) => Promise<{ places?: Array<Record<string, unknown>> }>;
          };
        }).Place;

        const fields = [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'regularOpeningHours',
          'nationalPhoneNumber',
          'googleMapsURI',
          'primaryTypeDisplayName'
        ];

        const catConfig = CATEGORY_OPTIONS.find((c) => c.id === category) || CATEGORY_OPTIONS[0];
        let rawPlaces: Array<Record<string, unknown>> = [];

        if (keyword.trim()) {
          const textQuery = `${keyword.trim()} ${category === 'all' ? 'hospital clinic doctor pharmacy' : category}`;
          const res = await PlaceClass.searchByText({
            textQuery,
            fields,
            locationBias: {
              center,
              radius: Math.min(radiusKm * 1000, 50000)
            },
            maxResultCount: 15,
            region: 'IN'
          });
          rawPlaces = res.places || [];
        } else {
          const res = await PlaceClass.searchNearby({
            fields,
            locationRestriction: {
              center,
              radius: Math.min(radiusKm * 1000, 50000)
            },
            includedPrimaryTypes: catConfig.googleTypes,
            maxResultCount: 15
          });
          rawPlaces = res.places || [];
        }

        if (cancelled) return;

        const mapped: RealCarePlace[] = rawPlaces
          .map((p, idx) => {
            const loc = p.location as { lat?: () => number; lng?: () => number } | undefined;
            const lat = typeof loc?.lat === 'function' ? loc.lat() : Number((loc as { lat?: number })?.lat);
            const lng = typeof loc?.lng === 'function' ? loc.lng() : Number((loc as { lng?: number })?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            const dist = calculateHaversineDistanceKm(center.lat, center.lng, lat, lng);
            const name =
              typeof p.displayName === 'string'
                ? p.displayName
                : ((p.displayName as { text?: string } | undefined)?.text || 'Healthcare Facility');
            const primaryType =
              typeof p.primaryTypeDisplayName === 'string'
                ? p.primaryTypeDisplayName
                : ((p.primaryTypeDisplayName as { text?: string } | undefined)?.text || catConfig.label);
            const opening = p.regularOpeningHours as { openNow?: boolean } | undefined;

            return {
              id: typeof p.id === 'string' ? p.id : `gmp-${idx}-${lat.toFixed(4)}`,
              name,
              category: primaryType,
              address: typeof p.formattedAddress === 'string' ? p.formattedAddress : '',
              lat,
              lng,
              distanceKm: dist,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
              userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
              openNow: typeof opening?.openNow === 'boolean' ? opening.openNow : undefined,
              phone: typeof p.nationalPhoneNumber === 'string' ? p.nationalPhoneNumber : undefined,
              mapsUrl:
                typeof p.googleMapsURI === 'string' && p.googleMapsURI
                  ? p.googleMapsURI
                  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            } as RealCarePlace;
          })
          .filter((item): item is RealCarePlace => item !== null && item.distanceKm <= radiusKm + 5)
          .sort((a, b) => a.distanceKm - b.distanceKm);

        setPlaces(mapped);
        onPlacesLoaded(mapped, false, null);
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to load nearby facilities from Google Places right now.';
        setPlaces([]);
        onPlacesLoaded([], false, msg);
      }
    };

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [placesLib, center.lat, center.lng, category, radiusKm, keyword, searchNonce]);

  return (
    <>
      {/* User's Current Center Pin */}
      <AdvancedMarker position={center} title="Selected Search Area">
        <Pin background="#0f766e" borderColor="#ffffff" glyphColor="#ffffff" />
      </AdvancedMarker>

      {/* Real Healthcare Facility Pins */}
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => onSelectPlace(place)}
          >
            <Pin
              background={isSelected ? '#0d9488' : '#e11d48'}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={isSelected ? 1.2 : 1}
            />
          </AdvancedMarker>
        );
      })}

      {/* InfoWindow for Selected Facility */}
      {selectedPlace && (
        <InfoWindow
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          onCloseClick={() => onSelectPlace(null)}
        >
          <div className="p-1 max-w-[230px] text-slate-900 space-y-1">
            <div className="text-xs font-extrabold leading-snug">{selectedPlace.name}</div>
            <div className="text-[11px] text-teal-700 font-semibold">
              {selectedPlace.category} • {selectedPlace.distanceKm} km away
            </div>
            {selectedPlace.address && (
              <p className="text-[11px] text-slate-600 leading-snug">{selectedPlace.address}</p>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 underline pt-0.5"
            >
              <span>Directions in Google Maps</span>
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

// ============================================================================
// LEAFLET / OPENSTREETMAP FALLBACK (ONLY when VITE_GOOGLE_MAPS_API_KEY is absent)
// Never combines Google Maps data onto Leaflet!
// ============================================================================
const LeafletViewportSync: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useLeafletMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [map, center[0], center[1]]);
  return null;
};

async function fetchOsmNearbyPlaces(
  lat: number,
  lng: number,
  radiusKm: number,
  category: CareCategory,
  keyword: string
): Promise<RealCarePlace[]> {
  const cat = CATEGORY_OPTIONS.find((c) => c.id === category) || CATEGORY_OPTIONS[0];
  const radiusMeters = Math.min(radiusKm * 1000, 25000);
  const query = `[out:json][timeout:12];(node["amenity"~"${cat.osmFilter}"](around:${radiusMeters},${lat},${lng});way["amenity"~"${cat.osmFilter}"](around:${radiusMeters},${lat},${lng}););out center 25;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error('OpenStreetMap directory temporarily busy. Try again in a moment.');
  }

  const json = await response.json();
  const elements = Array.isArray(json.elements) ? json.elements : [];
  const lowerKey = keyword.trim().toLowerCase();

  return elements
    .map((el: Record<string, unknown>, idx: number) => {
      const tags = (el.tags || {}) as Record<string, string>;
      const name = tags.name || tags['name:en'] || '';
      if (!name) return null;

      const elCenter = el.center as { lat?: number; lon?: number } | undefined;
      const pLat = typeof el.lat === 'number' ? el.lat : elCenter?.lat;
      const pLng = typeof el.lon === 'number' ? el.lon : elCenter?.lon;
      if (typeof pLat !== 'number' || typeof pLng !== 'number') return null;

      const amenity = tags.amenity || 'healthcare';
      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'],
        tags['addr:city']
      ].filter(Boolean);

      const place: RealCarePlace = {
        id: `osm-${el.id || idx}`,
        name,
        category: amenity.charAt(0).toUpperCase() + amenity.slice(1),
        address: addressParts.join(', ') || tags['addr:full'] || 'Address via OpenStreetMap',
        lat: pLat,
        lng: pLng,
        distanceKm: calculateHaversineDistanceKm(lat, lng, pLat, pLng),
        phone: tags.phone || tags['contact:phone'] || undefined,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${pLat}&mlon=${pLng}#map=16/${pLat}/${pLng}`
      };

      if (lowerKey) {
        const hay = `${place.name} ${place.category} ${place.address}`.toLowerCase();
        if (!hay.includes(lowerKey)) return null;
      }

      return place;
    })
    .filter((p: RealCarePlace | null): p is RealCarePlace => p !== null)
    .sort((a: RealCarePlace, b: RealCarePlace) => a.distanceKm - b.distanceKm)
    .slice(0, 20);
}

// ============================================================================
// MAIN VIEW: DOCTORS & CARE NEARBY
// ============================================================================
export const DoctorsNearbyView: React.FC = () => {
  const { currentUser, showToast, addReminder, setTab } = useApp();

  const [activeTab, setActiveTab] = useState<'explore' | 'saved'>('explore');

  // Initial category (honors jump from Prescriptions -> Pharmacies)
  const [category, setCategory] = useState<CareCategory>(() => {
    try {
      const preset = sessionStorage.getItem('healyaar_doctors_filter');
      if (preset) {
        sessionStorage.removeItem('healyaar_doctors_filter');
        if (
          preset === 'pharmacy' ||
          preset === 'hospital' ||
          preset === 'clinic' ||
          preset === 'doctor'
        ) {
          return preset;
        }
      }
    } catch {
      // ignore
    }
    return 'all';
  });

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [searchNonce, setSearchNonce] = useState<number>(0);

  // User Location
  const [userLocation, setUserLocation] = useState<UserGeoLocation>(() => {
    try {
      const saved = sessionStorage.getItem('healyaar_user_location');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_LOCATION;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualCityInput, setManualCityInput] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Real Facilities & Selection
  const [places, setPlaces] = useState<RealCarePlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Gemini 4 Hydrogen Grounding with Google Maps (used strictly in Google Maps mode)
  const [groundedSummary, setGroundedSummary] = useState<string | null>(null);
  const [groundedSources, setGroundedSources] = useState<GoogleMapsGroundingSource[]>([]);
  const [groundedPoweredBy, setGroundedPoweredBy] = useState<string | null>(null);
  const [isLoadingGrounded, setIsLoadingGrounded] = useState<boolean>(false);

  // Saved Favorite Places (per-user Supabase RLS)
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);

  // Appointment Reminder Modal
  const [reminderPlace, setReminderPlace] = useState<{
    name: string;
    address: string;
    category: string;
  } | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(getLocalTomorrowIso);
  const [appointmentTime, setAppointmentTime] = useState<string>('10:30');
  const [appointmentNotes, setAppointmentNotes] = useState<string>(
    'Carry recent blood reports and active prescription list.'
  );
  const [appointmentSaved, setAppointmentSaved] = useState<boolean>(false);

  // Load user's saved favorite clinics & doctors
  useEffect(() => {
    let active = true;
    if (currentUser?.id) {
      favoritesService.getFavorites(currentUser.id).then((list) => {
        if (active) setFavorites(list);
      });
    } else {
      setFavorites([]);
    }
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Voice assistant filter listener
  useEffect(() => {
    const handleVoiceFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ specialty?: string; query?: string }>).detail;
      if (detail?.specialty) {
        setKeywordInput(detail.specialty);
        setAppliedKeyword(detail.specialty);
      } else if (detail?.query) {
        setKeywordInput(detail.query);
        setAppliedKeyword(detail.query);
      }
    };
    window.addEventListener('healyaar_voice_filter_specialty', handleVoiceFilter);
    return () => window.removeEventListener('healyaar_voice_filter_specialty', handleVoiceFilter);
  }, []);

  const persistLocation = (loc: UserGeoLocation) => {
    setUserLocation(loc);
    try {
      sessionStorage.setItem('healyaar_user_location', JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const handleDetectGps = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getBrowserCurrentPosition();
      const geo = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      const loc: UserGeoLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        locationName: geo.locationName,
        city: geo.city,
        state: geo.state,
        isManual: false
      };
      persistLocation(loc);
      showToast(`Located: ${geo.locationName}`);
    } catch (err) {
      setLocationError(
        err instanceof Error
          ? err.message
          : 'Could not detect GPS location. Enter your city or PIN code below.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCityInput.trim()) return;
    setIsGeocoding(true);
    setLocationError(null);
    try {
      const geo = await forwardGeocodeLocation(manualCityInput);
      if (geo) {
        persistLocation(geo);
        setManualCityInput('');
        showToast(`Search area set to ${geo.locationName}`);
      } else {
        setLocationError(`Could not find coordinates for "${manualCityInput}". Try a nearby city or PIN code.`);
      }
    } catch {
      setLocationError('Location lookup failed. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleQuickCity = async (query: string) => {
    setIsGeocoding(true);
    setLocationError(null);
    try {
      const geo = await forwardGeocodeLocation(query);
      if (geo) {
        persistLocation(geo);
        showToast(`Location set to ${geo.locationName}`);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Trigger Gemini 4 Hydrogen Grounding with Google Maps ONLY when Google Maps mode is active
  useEffect(() => {
    if (!HAS_GOOGLE_MAPS || activeTab !== 'explore') return;
    let cancelled = false;

    const fetchGroundedSummary = async () => {
      setIsLoadingGrounded(true);
      try {
        const res = await aiClient.searchNearbyCare({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          category: category === 'all' ? 'hospitals, clinics, doctors, and pharmacies' : category,
          query: appliedKeyword || undefined
        });
        if (!cancelled) {
          setGroundedSummary(res.summaryMarkdown || null);
          setGroundedSources(Array.isArray(res.googleMapsSources) ? res.googleMapsSources : []);
          setGroundedPoweredBy(res.poweredBy || 'Gemini 4 Hydrogen');
        }
      } catch (err) {
        if (!cancelled) {
          if (isQuotaError(err)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          setGroundedSummary(null);
          setGroundedSources([]);
          setGroundedPoweredBy(null);
        }
      } finally {
        if (!cancelled) setIsLoadingGrounded(false);
      }
    };

    void fetchGroundedSummary();
    return () => {
      cancelled = true;
    };
  }, [
    userLocation.latitude,
    userLocation.longitude,
    category,
    appliedKeyword,
    searchNonce,
    activeTab
  ]);

  // Pure OpenStreetMap Overpass query ONLY when Google Maps key is NOT configured
  useEffect(() => {
    if (HAS_GOOGLE_MAPS || activeTab !== 'explore') return;
    let cancelled = false;

    const loadOsm = async () => {
      setIsLoadingPlaces(true);
      setPlacesError(null);
      try {
        const res = await fetchOsmNearbyPlaces(
          userLocation.latitude,
          userLocation.longitude,
          radiusKm,
          category,
          appliedKeyword
        );
        if (!cancelled) {
          setPlaces(res);
          setSelectedPlaceId(res[0]?.id || null);
        }
      } catch (err) {
        if (!cancelled) {
          setPlaces([]);
          setPlacesError(
            err instanceof Error ? err.message : 'Unable to fetch nearby healthcare places.'
          );
        }
      } finally {
        if (!cancelled) setIsLoadingPlaces(false);
      }
    };

    void loadOsm();
    return () => {
      cancelled = true;
    };
  }, [
    userLocation.latitude,
    userLocation.longitude,
    radiusKm,
    category,
    appliedKeyword,
    searchNonce,
    activeTab
  ]);

  const handleGooglePlacesLoaded = useCallback(
    (loaded: RealCarePlace[], loading: boolean, error: string | null) => {
      setIsLoadingPlaces(loading);
      setPlacesError(error);
      if (!loading) {
        setPlaces(loaded);
        setSelectedPlaceId((prev) =>
          prev && loaded.some((p) => p.id === prev) ? prev : loaded[0]?.id || null
        );
      }
    },
    []
  );

  const isPlaceSaved = (place: RealCarePlace): FavoritePlace | undefined =>
    favorites.find(
      (f) =>
        f.placeName.toLowerCase() === place.name.toLowerCase() &&
        Math.abs(f.lat - place.lat) < 0.001 &&
        Math.abs(f.lng - place.lng) < 0.001
    );

  const handleToggleFavorite = async (place: RealCarePlace) => {
    if (!currentUser?.id) return;
    setSavingPlaceId(place.id);
    try {
      const existing = isPlaceSaved(place);
      if (existing) {
        await favoritesService.removeFavorite(currentUser.id, existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        showToast(`Removed ${place.name} from saved clinics.`);
      } else {
        const saved = await favoritesService.addFavorite(currentUser.id, {
          placeName: place.name,
          category: place.category,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
          phone: place.phone
        });
        setFavorites((prev) => [saved, ...prev]);
        showToast(`Saved ${place.name} to My Saved Clinics & Doctors.`);
      }
    } finally {
      setSavingPlaceId(null);
    }
  };

  const handleRemoveFavorite = async (fav: FavoritePlace) => {
    if (!currentUser?.id) return;
    await favoritesService.removeFavorite(currentUser.id, fav.id);
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    showToast(`Removed ${fav.placeName} from saved places.`);
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderPlace) return;
    addReminder({
      title: `Visit: ${reminderPlace.name}`,
      type: 'appointment',
      time: appointmentTime,
      date: appointmentDate,
      repeatDays: ['Once'],
      instructions: `${reminderPlace.category} • ${reminderPlace.address}. ${appointmentNotes}`,
      active: true,
      clinicName: reminderPlace.name,
      isPersonalReminder: true
    });
    setAppointmentSaved(true);
    showToast(`Personal visit reminder saved for ${appointmentDate} at ${appointmentTime}.`);
  };

  const mapCenter = useMemo(
    () => ({ lat: userLocation.latitude, lng: userLocation.longitude }),
    [userLocation.latitude, userLocation.longitude]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <SectionHero
        title="Nearby Care & Live Map"
        badge={{
          icon: Stethoscope,
          text: HAS_GOOGLE_MAPS ? 'Google Maps Live' : 'OpenStreetMap Live',
          variant: 'emerald'
        }}
        illustration={<DoctorFinderIllustration size="md" />}
        actions={
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={isLocating}
            className="interactive-button inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-60 whitespace-nowrap"
          >
            {isLocating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Detecting GPS...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Use My GPS Location</span>
              </>
            )}
          </button>
        }
      />

      {/* Tabs: Nearby Care Map | My Saved Clinics & Doctors */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Care finder views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'explore'}
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'explore'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span>Nearby Care Map</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
            <span>My Saved Clinics &amp; Doctors ({favorites.length})</span>
          </button>
        </div>

        <div className="px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <span className="truncate max-w-[260px]">{userLocation.locationName}</span>
        </div>
      </div>

      {/* TAB 1: REAL INTERACTIVE NEARBY CARE MAP */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Search & Filters Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* City / Locality / PIN Search */}
              <form onSubmit={handleCitySearch} className="lg:col-span-6 flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={manualCityInput}
                    onChange={(e) => setManualCityInput(e.target.value)}
                    placeholder="Change area: city, locality, or PIN code..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGeocoding}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap disabled:opacity-60"
                >
                  {isGeocoding ? 'Locating...' : 'Set Area'}
                </button>
              </form>

              {/* Specialty / Facility Keyword Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedKeyword(keywordInput.trim());
                  setSearchNonce((n) => n + 1);
                }}
                className="lg:col-span-6 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Filter specialty or name (e.g. Cardiologist, Pediatrician, 24x7)..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold whitespace-nowrap"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Quick Cities Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Quick Cities:</span>
              {QUICK_CITIES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleQuickCity(c.query)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-700 dark:hover:text-teal-300 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Category & Radius Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      category === cat.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Radius:</span>
                {[5, 10, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      radiusKm === r
                        ? 'bg-slate-900 dark:bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {locationError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
                  <span>{locationError}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLocationError(null)}
                  className="font-bold"
                  aria-label="Dismiss location notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          {/* Split Layout: Live Interactive Map + Facility Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Map Panel */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="h-[440px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-950">
                {HAS_GOOGLE_MAPS ? (
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="en" region="IN">
                    <GoogleMap
                      defaultCenter={mapCenter}
                      defaultZoom={13}
                      mapId="DEMO_MAP_ID"
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      className="w-full h-full"
                    >
                      <GoogleCareMapController
                        center={mapCenter}
                        category={category}
                        radiusKm={radiusKm}
                        keyword={appliedKeyword}
                        searchNonce={searchNonce}
                        selectedPlaceId={selectedPlaceId}
                        onSelectPlace={(p) => setSelectedPlaceId(p?.id || null)}
                        onPlacesLoaded={handleGooglePlacesLoaded}
                      />
                    </GoogleMap>
                  </APIProvider>
                ) : (
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="w-full h-full z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LeafletViewportSync center={[mapCenter.lat, mapCenter.lng]} />
                    <Marker
                      position={[mapCenter.lat, mapCenter.lng]}
                      icon={makeLeafletPinIcon('#0f766e', true)}
                    >
                      <Popup>
                        <strong>Selected Area:</strong> {userLocation.locationName}
                      </Popup>
                    </Marker>
                    {places.map((place) => (
                      <Marker
                        key={place.id}
                        position={[place.lat, place.lng]}
                        icon={makeLeafletPinIcon(
                          place.id === selectedPlaceId ? '#0d9488' : '#e11d48',
                          place.id === selectedPlaceId
                        )}
                        eventHandlers={{
                          click: () => setSelectedPlaceId(place.id)
                        }}
                      >
                        <Popup>
                          <div className="space-y-1 text-xs">
                            <div className="font-bold">{place.name}</div>
                            <div>
                              {place.category} • {place.distanceKm} km
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 font-bold underline"
                            >
                              Directions
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>

              {/* Gemini 4 Hydrogen Grounding with Google Maps Summary + Mandatory Source Attribution */}
              {HAS_GOOGLE_MAPS && (isLoadingGrounded || groundedSummary) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      <span>AI Local Care Guide (Google Maps Grounded)</span>
                    </h3>
                    {groundedPoweredBy && (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        Powered by {groundedPoweredBy}
                      </span>
                    )}
                  </div>

                  {isLoadingGrounded ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Checking verified healthcare places around {userLocation.locationName}...</span>
                    </div>
                  ) : (
                    <>
                      {groundedSummary && (
                        <SafeMarkdown
                          content={groundedSummary}
                          className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                        />
                      )}

                      {/* Mandatory Google Maps Grounding Source Attribution */}
                      {groundedSources.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Verified Google Maps Sources
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {groundedSources.map((src, idx) => (
                              <a
                                key={`${src.uri}-${idx}`}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-[11px] font-bold text-teal-700 dark:text-teal-300 transition-colors"
                              >
                                <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                                <span>{src.title}</span>
                                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Real Facility Cards List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" aria-hidden="true" />
                  <span>
                    {isLoadingPlaces
                      ? 'Searching nearby facilities...'
                      : `${places.length} Real Facilities Within ${radiusKm} km`}
                  </span>
                </h2>
                {appliedKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeywordInput('');
                      setAppliedKeyword('');
                    }}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {placesError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>Live Directory Notice</span>
                  </div>
                  <p>{placesError}</p>
                </div>
              )}

              {isLoadingPlaces ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : places.length === 0 ? (
                <EmptyStateCard
                  icon={<MapPin className="w-6 h-6" aria-hidden="true" />}
                  title="No matching facilities found in this radius"
                  description="Try increasing the search radius to 25 km, switching category to All Healthcare, or searching a nearby city."
                  actionText="Expand to 25 km"
                  onAction={() => {
                    setRadiusKm(25);
                    setCategory('all');
                    setKeywordInput('');
                    setAppliedKeyword('');
                  }}
                />
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {places.map((place) => {
                    const isSelected = place.id === selectedPlaceId;
                    const savedEntry = isPlaceSaved(place);
                    return (
                      <article
                        key={place.id}
                        onClick={() => setSelectedPlaceId(place.id)}
                        className={`cursor-pointer rounded-2xl p-4 border transition-all space-y-3 ${
                          isSelected
                            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                                {place.category}
                              </span>
                              {typeof place.openNow === 'boolean' && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    place.openNow
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {place.openNow ? 'Open now' : 'Closed'}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                              {place.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300 whitespace-nowrap">
                              {place.distanceKm} km
                            </span>
                            <button
                              type="button"
                              disabled={savingPlaceId === place.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleFavorite(place);
                              }}
                              aria-label={
                                savedEntry
                                  ? `Remove ${place.name} from favorites`
                                  : `Save ${place.name} to favorites`
                              }
                              className={`p-1.5 rounded-xl border transition-colors ${
                                savedEntry
                                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${savedEntry ? 'fill-current' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        {place.address && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {place.address}
                          </p>
                        )}

                        {typeof place.rating === 'number' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                            <span>{place.rating.toFixed(1)}</span>
                            {typeof place.userRatingCount === 'number' && (
                              <span className="text-slate-400 font-normal">
                                ({place.userRatingCount} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Directions</span>
                          </a>

                          {place.phone && (
                            <a
                              href={`tel:${place.phone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
                            >
                              <Phone className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                              <span>Call</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReminderPlace({
                                name: place.name,
                                address: place.address,
                                category: place.category
                              });
                              setAppointmentSaved(false);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
                          >
                            <Calendar className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                            <span>Reminder</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY SAVED CLINICS & DOCTORS */}
      {activeTab === 'saved' && (
        <section className="space-y-4">
          {favorites.length === 0 ? (
            <EmptyStateCard
              icon={<BookmarkCheck className="w-6 h-6" aria-hidden="true" />}
              title="No saved clinics or doctors yet"
              description="Tap the heart button on any real hospital, clinic, doctor, or pharmacy on the Nearby Care Map to bookmark it to your private account."
              actionText="Explore Nearby Care Map"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((fav) => (
                <article
                  key={fav.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold">
                        {fav.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveFavorite(fav)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label={`Remove ${fav.placeName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {fav.placeName}
                    </h3>
                    {fav.address && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {fav.address}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <a
                      href={
                        fav.mapsUrl ||
                        `https://www.google.com/maps/dir/?api=1&destination=${fav.lat},${fav.lng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                    >
                      <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Directions</span>
                    </a>
                    {fav.phone && (
                      <a
                        href={`tel:${fav.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                        <span>Call</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setReminderPlace({
                          name: fav.placeName,
                          address: fav.address,
                          category: fav.category
                        });
                        setAppointmentSaved(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                      <span>Visit Reminder</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Safety Footer */}
      <footer className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Always confirm clinic timings and doctor availability directly by phone before traveling. For medical emergencies in India, dial <strong>108</strong> (Ambulance) or <strong>112</strong> (National Emergency) immediately.
        </p>
      </footer>

      {/* Personal Visit Reminder Modal */}
      <PortalModal
        isOpen={Boolean(reminderPlace)}
        onClose={() => setReminderPlace(null)}
        ariaLabelledBy="visit-reminder-modal-title"
      >
        {reminderPlace && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  id="visit-reminder-modal-title"
                  className="text-lg font-extrabold text-slate-900 dark:text-white"
                >
                  Save Personal Visit Reminder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {reminderPlace.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderPlace(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appointmentSaved ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Personal reminder added!</span>
                </div>
                <p>
                  Remember to call the clinic directly to confirm your slot—this reminder is stored privately in your HealYaar schedule.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReminderPlace(null);
                      setTab('reminders');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
                  >
                    View Reminders
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveReminder} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReminderPlace(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </PortalModal>
    </div>
  );
};
