import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { Profile } from '@/lib/types';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { CompanyLogo } from '@/components/CompanyLogo';
import { getCompanyLogoUrl } from '@/lib/utils/companyLogo';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  count?: number;
  cityCount?: number;
  companyCount?: number;
}

interface Leaderboards {
  historyCounts: LeaderboardEntry[];
  jetsetters: LeaderboardEntry[];
  employerHoppers: LeaderboardEntry[];
}

interface ResidencyLeader {
  name: string;
  count: number;
  bscCount: number;
  mscCount: number;
  percentage: number;
}

interface ChampionCompany {
  company: string;
  count: number;
}

interface DestinationCity {
  city: string;
  count: number;
}

interface GawkLeaderboardsTabProps {
  analyticsLoading: boolean;
  dataLoading: boolean;
  leaderboards: Leaderboards;
  residencyLeaders: ResidencyLeader[];
  championCompanies: ChampionCompany[];
  destinationCities: DestinationCity[];
  companyLogoMap: ReturnType<typeof import('@/lib/utils/companyLogo').buildCompanyLogoMap> | null;
  profiles: Profile[];
}

export const GawkLeaderboardsTab = memo(function GawkLeaderboardsTab({
  analyticsLoading,
  dataLoading,
  leaderboards,
  residencyLeaders,
  championCompanies,
  destinationCities,
  companyLogoMap,
  profiles,
}: GawkLeaderboardsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Biggest gawker</CardTitle>
            <CardDescription>Most logins to the site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : leaderboards.historyCounts.length > 0 ? (
              leaderboards.historyCounts.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ProfileAvatar
                      src={entry.avatarUrl}
                      fullName={entry.name}
                      size="sm"
                    />
                    <p className="font-medium">{entry.name}</p>
                  </div>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No history yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jetsetter</CardTitle>
            <CardDescription>Most distinct locations seen in history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : leaderboards.jetsetters.length > 0 ? (
              leaderboards.jetsetters.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ProfileAvatar
                      src={entry.avatarUrl}
                      fullName={entry.name}
                      size="sm"
                    />
                    <p className="font-medium">{entry.name}</p>
                  </div>
                  <Badge variant="outline">{entry.cityCount} cities</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No travel data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Antiloyalist</CardTitle>
            <CardDescription>Most distinct employers over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : leaderboards.employerHoppers.length > 0 ? (
              leaderboards.employerHoppers.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ProfileAvatar
                      src={entry.avatarUrl}
                      fullName={entry.name}
                      size="sm"
                    />
                    <p className="font-medium">{entry.name}</p>
                  </div>
                  <Badge variant="outline">{entry.companyCount} employers</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No employer change data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biggest residency hirers</CardTitle>
            <CardDescription>Residency partners with the most ISE alumni</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : residencyLeaders.length > 0 ? (
              residencyLeaders.slice(0, 3).map((partner) => {
                const logoUrl = companyLogoMap
                  ? getCompanyLogoUrl(partner.name, companyLogoMap)
                  : null;
                return (
                  <div
                    key={partner.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <CompanyLogo
                        name={partner.name}
                        logoUrl={logoUrl}
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {partner.percentage}% of eligible alumni
                      </span>
                    </div>
                    <Badge variant="outline">{partner.count} ppl</Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No residency partner matches yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Champion-heavy companies</CardTitle>
            <CardDescription>Companies with the most ISE champions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : championCompanies.length > 0 ? (
              championCompanies.map((item) => {
                const logoUrl = companyLogoMap
                  ? getCompanyLogoUrl(item.company, companyLogoMap)
                  : null;
                return (
                  <div key={item.company} className="flex items-center justify-between p-2 border rounded-lg">
                    <CompanyLogo
                      name={item.company}
                      logoUrl={logoUrl}
                      size="sm"
                    />
                    <Badge variant="outline">{item.count} champions</Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No champion company data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destination cities</CardTitle>
            <CardDescription>Where alumni are currently clustered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : destinationCities.length > 0 ? (
              destinationCities.map((item) => (
                <div key={item.city} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{item.city}</p>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No destination city data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

