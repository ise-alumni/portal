import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { Profile } from '@/lib/types';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface LocationLeader {
  city: string;
  count: number;
}

interface RecentMover {
  id: string;
  name: string;
  path: { cityLabel: string; changedAt: string }[];
  cityCount: number;
  lastChangedAt: string | null;
}

interface GawkMobilityTabProps {
  dataLoading: boolean;
  analyticsLoading: boolean;
  locationLeaders: LocationLeader[];
  recentMovers: RecentMover[];
  profiles: Profile[];
}

export const GawkMobilityTab = memo(function GawkMobilityTab({
  dataLoading,
  analyticsLoading,
  locationLeaders,
  recentMovers,
  profiles,
}: GawkMobilityTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Location leaders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : locationLeaders.length > 0 ? (
              locationLeaders.map((item) => (
                <div key={item.city} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{item.city}</p>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No location data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent movers</CardTitle>
            <CardDescription>Compact paths for alumni who have moved between cities</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentMovers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {recentMovers.map((mover) => {
                  const moverProfile = profiles.find((p) => p.id === mover.id) || null;
                  return (
                    <div
                      key={mover.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ProfileAvatar
                            src={moverProfile?.avatar_url || null}
                            fullName={mover.name}
                            size="sm"
                          />
                          <p className="font-medium">{mover.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {mover.cityCount} cities
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mover.path.map((step, index) => (
                          <span key={`${mover.id}-${index}`}>
                            {index > 0 && <span className="mx-1">→</span>}
                            <span>{step.cityLabel}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No movement paths detected yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

