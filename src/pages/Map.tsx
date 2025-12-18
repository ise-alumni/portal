import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl';
import { UsersIcon, UserIcon, Loader2Icon, BuildingIcon, RouteIcon, ClockIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfileHistory, type ProfileHistory } from "@/lib/domain/profiles";
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getCohortBadgeClass } from '@/lib/utils/ui';
import { Link } from "react-router-dom";

interface AlumniData {
  id: string;
  name: string;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  location: { lat: number; lng: number };
  graduationYear: number | null;
  cohort: number | null;
  msc: boolean | null;
  city: string | null;
  country: string | null;
}

interface MovementPath {
  userId: string;
  userName: string;
  color: string;
  coordinates: [number, number][];
  timestamps: string[];
  locations: Array<{
    city: string | null;
    country: string | null;
    company: string | null;
    jobTitle: string | null;
  }>;
}

type ViewMode = "current" | "overtime";

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Generate distinct colors for users
const generateUserColor = (userId: string, index: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#8ECAE6', '#FFB4A2'
  ];
  return colors[index % colors.length];
};

// Geocoding function using Nominatim (OpenStreetMap) - free, no API key needed
const geocodeLocation = async (city: string, country: string | null): Promise<{ lat: number; lng: number } | null> => {
  try {
    const query = country ? `${city}, ${country}` : city;
    const encodedQuery = encodeURIComponent(query);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'ISE Alumni Portal' // Required by Nominatim API - this is free to use
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const MapPage = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.577792029248203, // ISE Building Default
    latitude: 52.673730281926886,
    zoom: 2,
    pitch: 0,
    bearing: 0
  });
  
  const [alumniData, setAlumniData] = useState<AlumniData[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniData | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<"all" | "msc" | "bsc">("all");
  
  // Over-time view states
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [movementPaths, setMovementPaths] = useState<MovementPath[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [selectedPath, setSelectedPath] = useState<MovementPath | null>(null);

  // Fetch alumni data for current view using RPC (pre-geocoded lat/lng)
  useEffect(() => {
    const fetchAlumniData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase.rpc<{
          profile_id: string;
          full_name: string | null;
          lat: number;
          lng: number;
          graduation_year: number | null;
          cohort: number | null;
          msc: boolean | null;
          company: string | null;
          city: string | null;
          country: string | null;
          avatar_url: string | null;
        }>('rpc_get_map_data', {
          view_mode: 'current',
        });

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.length === 0) {
          setAlumniData([]);
          return;
        }

        const mappedData: AlumniData[] = data.map((row) => ({
          id: row.profile_id,
          name: row.full_name || 'Unknown',
          avatarUrl: row.avatar_url || null,
          company: row.company || null,
          jobTitle: null, // not needed in popup
          location: {
            lat: row.lat,
            lng: row.lng,
          },
          graduationYear: row.graduation_year,
          cohort: row.cohort,
          msc: row.msc,
          city: row.city,
          country: row.country,
        }));

        setAlumniData(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alumni data');
      } finally {
        setLoading(false);
        setGeocoding(false);
      }
    };

    fetchAlumniData();
  }, []);

  const handleMarkerClick = useCallback((alumni: AlumniData) => {
    setSelectedAlumni(alumni);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedAlumni(null);
  }, []);

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  // Fetch and process profile history for movement paths via RPC
  const fetchMovementPaths = useCallback(async () => {
    try {
      setLoadingHistory(true);

      const { data, error } = await supabase.rpc<{
        profile_id: string;
        full_name: string | null;
        timestamps: string[] | null;
        cities: (string | null)[] | null;
        countries: (string | null)[] | null;
        companies: (string | null)[] | null;
        job_titles: (string | null)[] | null;
        lats: number[] | null;
        lngs: number[] | null;
      }>('rpc_get_map_data', {
        view_mode: 'overtime',
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setMovementPaths([]);
        return;
      }

      const paths: MovementPath[] = [];
      let userIndex = 0;

      for (const row of data) {
        const timestamps: string[] = row.timestamps || [];
        const cities: (string | null)[] = row.cities || [];
        const countries: (string | null)[] = row.countries || [];
        const companies: (string | null)[] = row.companies || [];
        const jobTitles: (string | null)[] = row.job_titles || [];
        const lats: number[] = row.lats || [];
        const lngs: number[] = row.lngs || [];

        const coordinates: [number, number][] = [];
        const locations: MovementPath["locations"] = [];

        for (let i = 0; i < lats.length && i < lngs.length; i++) {
          coordinates.push([lngs[i], lats[i]]);
          locations.push({
            city: cities[i] || null,
            country: countries[i] || null,
            company: companies[i] || null,
            jobTitle: jobTitles[i] || null,
          });
        }

        if (coordinates.length >= 2) {
          paths.push({
            userId: row.profile_id,
            userName: row.full_name || "Unknown",
            color: generateUserColor(row.profile_id, userIndex++),
            coordinates,
            timestamps: timestamps,
            locations,
          });
        }
      }

      setMovementPaths(paths);
    } catch (err) {
      console.error("Error fetching movement paths:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch movement paths when switching to over-time view
  useEffect(() => {
    if (viewMode === "overtime" && movementPaths.length === 0) {
      fetchMovementPaths();
    }
  }, [viewMode, movementPaths.length, fetchMovementPaths]);

  // Re-fetch movement paths when filters change and in over-time mode to ensure we have all data
  useEffect(() => {
    if (viewMode === "overtime" && movementPaths.length > 0) {
      // Only re-fetch if we haven't fetched yet or if filters are applied
      fetchMovementPaths();
    }
  }, [viewMode, companyFilter, cohortFilter, gradYearFilter, degreeFilter, fetchMovementPaths]);

  const filteredAlumni = useMemo(() => {
    return alumniData.filter((alumni) => {
      const matchesCompany = companyFilter
        ? alumni.company?.toLowerCase().includes(companyFilter.toLowerCase())
        : true;

      const matchesCohort = cohortFilter
        ? alumni.cohort === Number(cohortFilter)
        : true;

      const matchesGradYear = gradYearFilter
        ? alumni.graduationYear === Number(gradYearFilter)
        : true;

      const matchesDegree =
        degreeFilter === "all"
          ? true
          : degreeFilter === "msc"
            ? alumni.msc === true
            : alumni.msc === false;

      return matchesCompany && matchesCohort && matchesGradYear && matchesDegree;
    });
  }, [alumniData, companyFilter, cohortFilter, gradYearFilter, degreeFilter]);

  // Filter movement paths based on the same criteria
  const filteredMovementPaths = useMemo(() => {
    if (viewMode !== "overtime") return movementPaths;
    
    return movementPaths.filter((path) => {
      // Check if any location in the path matches the filters
      return path.locations.some((location) => {
        const matchesCompany = companyFilter
          ? location.company?.toLowerCase().includes(companyFilter.toLowerCase())
          : true;

        // For cohort and graduation year, we need to fetch the user's current profile data
        // since history doesn't track these fields. We'll use a simple approach by checking
        // if the user ID exists in our alumni data and matches the filters.
        const userProfile = alumniData.find(alumni => alumni.id === path.userId);
        
        const matchesCohort = cohortFilter
          ? userProfile?.cohort === Number(cohortFilter)
          : true;

        const matchesGradYear = gradYearFilter
          ? userProfile?.graduationYear === Number(gradYearFilter)
          : true;

        const matchesDegree =
          degreeFilter === "all"
            ? true
            : degreeFilter === "msc"
              ? userProfile?.msc === true
              : userProfile?.msc === false;

        return matchesCompany && matchesCohort && matchesGradYear && matchesDegree;
      });
    });
  }, [movementPaths, viewMode, companyFilter, cohortFilter, gradYearFilter, degreeFilter, alumniData]);

  // Heatmap data
  const heatmapData = {
    type: 'FeatureCollection' as const,
    features: filteredAlumni.map(alumni => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [alumni.location.lng, alumni.location.lat]
      },
      properties: {
        weight: 1
      }
    }))
  };

  if (loading || geocoding || (viewMode === "overtime" && loadingHistory)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h1 className="text-2xl sm:text-3xl font-bold">Map</h1>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {loadingHistory ? 'Loading movement history...' : 
               geocoding ? 'Geocoding locations...' : 
               'Loading alumni data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h1 className="text-2xl sm:text-3xl font-bold">Map</h1>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading alumni data</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
           <h1 className="text-2xl sm:text-3xl font-bold">Map</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("current")}
            className="flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" />
            Current
          </Button>
          <Button
            variant={viewMode === "overtime" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("overtime")}
            className="flex items-center gap-2"
          >
            <ClockIcon className="w-4 h-4" />
            Over Time
          </Button>
        </div>
      </div>

      <Card className="border-2 border-foreground shadow-none">
        <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-filter">Company</Label>
            <Input
              id="company-filter"
              placeholder="Company name"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cohort-filter">Cohort</Label>
            <Input
              id="cohort-filter"
              placeholder="e.g. 2020"
              inputMode="numeric"
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grad-year-filter">Graduation Year</Label>
            <Input
              id="grad-year-filter"
              placeholder="e.g. 2024"
              inputMode="numeric"
              value={gradYearFilter}
              onChange={(e) => setGradYearFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Degree</Label>
            <Select value={degreeFilter} onValueChange={(value: "all" | "msc" | "bsc") => setDegreeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="msc">MSc</SelectItem>
                <SelectItem value="bsc">BSc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        </CardContent>
        <div className="px-6 pb-4 text-sm text-muted-foreground">
          {viewMode === "current" 
            ? `Showing ${filteredAlumni.length} of ${alumniData.length} alumni`
            : `Showing ${filteredMovementPaths.length} of ${movementPaths.length} movement paths`
          }
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="border-2 border-foreground shadow-none">
            <CardContent className="p-0">
              <div className="h-[600px] w-full">
                <Map
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                >
                  {/* Heatmap Layer */}
                  {showHeatmap && (
                    <Source id="heatmap" type="geojson" data={heatmapData}>
                      <Layer
                        id="heatmap-layer"
                        type="heatmap"
                        paint={{
                          'heatmap-weight': {
                            property: 'weight',
                            type: 'exponential',
                            stops: [[0, 0], [1, 1]]
                          },
                          'heatmap-intensity': 1,
                          'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(33,102,172,0)',
                            0.2, 'rgb(103,169,207)',
                            0.4, 'rgb(209,229,240)',
                            0.6, 'rgb(253,219,199)',
                            0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                          ],
                          'heatmap-radius': 20,
                          'heatmap-opacity': 0.8
                        }}
                      />
                    </Source>
                  )}

                   {/* Movement Paths */}
                   {viewMode === "overtime" && filteredMovementPaths.map((path, index) => (
                     <Source key={`path-${path.userId}`} type="geojson" data={{
                       type: 'Feature',
                       geometry: {
                         type: 'LineString',
                         coordinates: path.coordinates
                       },
                       properties: {
                         userId: path.userId,
                         userName: path.userName,
                         color: path.color
                       }
                     }}>
                       <Layer
                         id={`path-layer-${path.userId}`}
                         type="line"
                         paint={{
                           'line-color': path.color,
                           'line-width': 3,
                           'line-opacity': 0.8
                         }}
                       />
                     </Source>
                   ))}

                   {/* Movement Path Markers */}
                   {viewMode === "overtime" && filteredMovementPaths.flatMap((path) =>
                     path.coordinates.map((coord, index) => (
                       <Marker
                         key={`${path.userId}-marker-${index}`}
                         longitude={coord[0]}
                         latitude={coord[1]}
                         onClick={() => setSelectedPath(path)}
                       >
                         <div 
                           className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                           style={{ backgroundColor: path.color }}
                         />
                       </Marker>
                     ))
                   )}

                   {/* Alumni Markers */}
                   {viewMode === "current" && !showHeatmap && filteredAlumni.map((alumni) => (
                     <Marker
                       key={alumni.id}
                       longitude={alumni.location.lng}
                       latitude={alumni.location.lat}
                       onClick={() => handleMarkerClick(alumni)}
                     >
                       <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                         <UserIcon className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                       </div>
                     </Marker>
                   ))}

                  {/* Alumni Popup */}
                  {selectedAlumni && viewMode === "current" && (
                    <Popup
                      longitude={selectedAlumni.location.lng}
                      latitude={selectedAlumni.location.lat}
                      onClose={handleClosePopup}
                      closeButton={true}
                      closeOnClick={false}
                      anchor="bottom"
                    >
                      <Link
                        to={`/profile/${selectedAlumni.id}`}
                        className="block min-w-[220px] max-w-xs rounded-lg border border-border bg-background p-4 shadow-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {selectedAlumni.avatarUrl ? (
                            <img
                              src={selectedAlumni.avatarUrl}
                              alt={`${selectedAlumni.name} avatar`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {selectedAlumni.name
                                .split(" ")
                                .map(word => word[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {selectedAlumni.name}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </Popup>
                  )}

                  {/* Movement Path Popup */}
                  {selectedPath && viewMode === "overtime" && (
                    <Popup
                      longitude={selectedPath.coordinates[0][0]}
                      latitude={selectedPath.coordinates[0][1]}
                      onClose={() => setSelectedPath(null)}
                      closeButton={true}
                      closeOnClick={false}
                      anchor="bottom"
                    >
                      <Link
                        to={`/profile/${selectedPath.userId}`}
                        className="block min-w-[220px] max-w-xs rounded-lg border border-border bg-background p-4 shadow-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const userProfile = alumniData.find(
                              alumni => alumni.id === selectedPath.userId
                            );
                            if (userProfile?.avatarUrl) {
                              return (
                                <img
                                  src={userProfile.avatarUrl}
                                  alt={`${selectedPath.userName} avatar`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              );
                            }
                            return (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {selectedPath.userName
                                  .split(" ")
                                  .map(word => word[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                            );
                          })()}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {selectedPath.userName}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </Popup>
                  )}
                </Map>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {viewMode === "current" && (
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={toggleHeatmap}
              className="flex items-center gap-2 w-full"
            >
              <UsersIcon className="w-4 h-4" />
              {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
            </Button>
          )}
          {viewMode === "current" ? (
            <>
              <Card className="border-2 border-foreground shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="tracking-tight text-sm">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Alumni</span>
                    <Badge variant="secondary">{filteredAlumni.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Companies</span>
                    <Badge variant="secondary">
                      {new Set(filteredAlumni.map(a => a.company).filter(Boolean)).size}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Countries</span>
                    <Badge variant="secondary">
                      {new Set(filteredAlumni.map(a => a.country).filter(Boolean)).size}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MSc</span>
                    <Badge variant="secondary">
                      {filteredAlumni.filter(a => a.msc === true).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">BSc</span>
                    <Badge variant="secondary">
                      {filteredAlumni.filter(a => a.msc === false).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cohorts</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {Array.from(
                        new Set(
                          filteredAlumni
                            .map(a => a.cohort)
                            .filter((c): c is number => c != null)
                        )
                      )
                        .sort((a, b) => a - b)
                        .map(cohort => (
                          <Badge
                            key={cohort}
                            variant="secondary"
                            className={`text-xs ${getCohortBadgeClass(cohort)}`}
                          >
                            Cohort {cohort}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-foreground shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="tracking-tight text-sm">Top Companies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      filteredAlumni.reduce((acc, alumni) => {
                        if (alumni.company) {
                          acc[alumni.company] = (acc[alumni.company] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([company, count]) => (
                        <div key={company} className="flex justify-between items-center text-xs">
                          <span className="truncate">{company}</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-2 border-foreground shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="tracking-tight text-sm">Movement Statistics</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Users with Paths</span>
                    <Badge variant="secondary">{filteredMovementPaths.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Movements</span>
                    <Badge variant="secondary">
                      {filteredMovementPaths.reduce((sum, path) => sum + path.locations.length, 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Countries Visited</span>
                    <Badge variant="secondary">
                      {new Set(
                        filteredMovementPaths.flatMap(path => 
                          path.locations.filter(l => l.country).map(l => l.country)
                        )
                      ).size}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MSc</span>
                    <Badge variant="secondary">
                      {filteredMovementPaths.filter(path => {
                        const userProfile = alumniData.find(alumni => alumni.id === path.userId);
                        return userProfile?.msc === true;
                      }).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">BSc</span>
                    <Badge variant="secondary">
                      {filteredMovementPaths.filter(path => {
                        const userProfile = alumniData.find(alumni => alumni.id === path.userId);
                        return userProfile?.msc === false;
                      }).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cohorts</span>
                    <div className="flex gap-1">
                      {Array.from(new Set(
                        filteredMovementPaths
                          .map(path => {
                            const userProfile = alumniData.find(alumni => alumni.id === path.userId);
                            return userProfile?.cohort;
                          })
                          .filter(Boolean)
                      )).sort((a, b) => a - b).map(cohort => (
                        <Badge key={cohort} variant="outline" className="text-xs">{cohort}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-foreground shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="tracking-tight text-sm flex items-center gap-2">
                    <RouteIcon className="w-4 h-4" />
                    Movement Paths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredMovementPaths.slice(0, 10).map((path) => (
                      <div 
                        key={path.userId} 
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted p-1 rounded"
                        onClick={() => setSelectedPath(path)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: path.color }}
                        />
                        <span className="truncate">{path.userName}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {path.locations.length}
                        </Badge>
                      </div>
                    ))}
                    {filteredMovementPaths.length === 0 && (
                      <p className="text-xs text-muted-foreground">No movement paths found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
