import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useEffect } from "react";
import { Map, Marker, Popup, Source, Layer } from 'react-map-gl';
import { MapPinIcon, UsersIcon, UserIcon, Loader2Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Alumni data interface
interface AlumniData {
  id: string;
  name: string;
  company: string;
  jobTitle: string | null;
  location: { lat: number; lng: number };
  graduationYear: number | null;
  city: string;
  country: string;
}

// Mapbox access token - get your own from https://mapbox.com
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapPage = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.577792029248203,
    latitude: 52.673730281926886,
    zoom: 2,
    pitch: 0,
    bearing: 0
  });
  
  const [alumniData, setAlumniData] = useState<AlumniData[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniData | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            current_company_id,
            current_office_id,
            companies!current_company_id (
              name
            ),
            company_offices!current_office_id (
              city,
              country,
              latitude,
              longitude
            )
          `)
          .not('current_office_id', 'is', null)
          .not('companies.name', 'is', null);

        if (fetchError) {
          throw fetchError;
        }

        // Transform the data to match our interface
        const transformedData: AlumniData[] = data
          .filter(profile => profile.companies && profile.company_offices)
          .map(profile => ({
            id: profile.id,
            name: profile.full_name || 'Unknown',
            company: profile.companies.name,
            jobTitle: profile.job_title,
            location: {
              lat: Number(profile.company_offices.latitude),
              lng: Number(profile.company_offices.longitude)
            },
            graduationYear: profile.graduation_year,
            city: profile.company_offices.city,
            country: profile.company_offices.country
          }));

        setAlumniData(transformedData);
      } catch (err) {
        console.error('Error fetching alumni data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch alumni data');
      } finally {
        setLoading(false);
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

  // heatmap data
  const heatmapData = {
    type: 'FeatureCollection' as const,
    features: alumniData.map(alumni => ({
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl tracking-tight">ALUMNI MAP</h1>
        </div>
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading alumni data...</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="tracking-tight flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Alumni Locations
              </CardTitle>
            </CardHeader>
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
                  {!showHeatmap && alumniData.map((alumni) => (
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
                          <UserIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{selectedAlumni.company}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{selectedAlumni.city}, {selectedAlumni.country}</p>
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
                <Badge variant="secondary">{alumniData.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Companies</span>
                <Badge variant="secondary">
                  {new Set(alumniData.map(a => a.company)).size}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cities</span>
                <Badge variant="secondary">
                  {new Set(alumniData.map(a => a.city)).size}
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
                  alumniData.reduce((acc, alumni) => {
                    acc[alumni.company] = (acc[alumni.company] || 0) + 1;
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


