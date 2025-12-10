import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl';
import { UsersIcon, UserIcon, Loader2Icon, BuildingIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface AlumniData {
  id: string;
  name: string;
  company: string | null;
  jobTitle: string | null;
  location: { lat: number; lng: number };
  graduationYear: number | null;
  cohort: number | null;
  msc: boolean | null;
  city: string | null;
  country: string | null;
}

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

  // Fetch alumni data from Supabase
  useEffect(() => {
    const fetchAlumniData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            job_title,
            graduation_year,
            cohort,
            city,
            country,
            company,
            msc
          `)
          .not('city', 'is', null)
          .not('country', 'is', null)
          .eq('is_public', true);

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.length === 0) {
          setAlumniData([]);
          setLoading(false);
          return;
        }

        // Geocode locations
        setGeocoding(true);
        const geocodedData: AlumniData[] = [];

        for (const profile of data) {
          if (!profile.city) {
            continue;
          }

          const location = await geocodeLocation(
            profile.city,
            profile.country
          );

          if (location) {
            const alumniEntry = {
              id: profile.id,
              name: profile.full_name || 'Unknown',
              company: profile.company || null,
              jobTitle: profile.job_title,
              location: location,
              graduationYear: profile.graduation_year,
              cohort: profile.cohort,
              msc: profile.msc,
              city: profile.city,
              country: profile.country
            };
            
            geocodedData.push(alumniEntry);
            
          } 
        }

        setAlumniData(geocodedData);
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

  if (loading || geocoding) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl tracking-tight">ALUMNI MAP</h1>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {geocoding ? 'Geocoding locations...' : 'Loading alumni data...'}
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
          <h1 className="text-2xl tracking-tight">ALUMNI MAP</h1>
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
        <h1 className="text-2xl tracking-tight">ALUMNI MAP</h1>
        <div className="flex gap-2">
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            onClick={toggleHeatmap}
            className="flex items-center gap-2"
          >
            <UsersIcon className="w-4 h-4" />
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-foreground shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="tracking-tight text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </CardContent>
        <div className="px-6 pb-4 text-sm text-muted-foreground">
          Showing {filteredAlumni.length} of {alumniData.length} alumni
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

                  {/* Alumni Markers */}
                  {!showHeatmap && filteredAlumni.map((alumni) => (
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

                  {/* Popup */}
                  {selectedAlumni && (
                    <Popup
                      longitude={selectedAlumni.location.lng}
                      latitude={selectedAlumni.location.lat}
                      onClose={handleClosePopup}
                      closeButton={true}
                      closeOnClick={false}
                      anchor="bottom"
                    >
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-sm">{selectedAlumni.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedAlumni.jobTitle || 'Job title not specified'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <BuildingIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{selectedAlumni.company || 'No company specified'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedAlumni.city}{selectedAlumni.country ? `, ${selectedAlumni.country}` : ''}
                        </p>
                        {selectedAlumni.graduationYear && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Class of {selectedAlumni.graduationYear}
                          </Badge>
                        )}
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default MapPage;
