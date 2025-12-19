import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3 } from 'lucide-react';
import { type ResidencyPartner, type ResidencyStats } from '@/lib/types/residency';
import { CompanyLogo } from '@/components/CompanyLogo';
import { getCompanyLogoUrl } from '@/lib/utils/companyLogo';

interface ResidencyLeader {
  name: string;
  count: number;
  bscCount: number;
  mscCount: number;
  percentage: number;
}

interface GawkResidencyTabProps {
  dataLoading: boolean;
  residencyStats: ResidencyStats | null;
  residencyPartners: ResidencyPartner[];
  residencyLeaders: ResidencyLeader[];
  companyLogoMap: ReturnType<typeof import('@/lib/utils/companyLogo').buildCompanyLogoMap> | null;
}

export function GawkResidencyTab({
  dataLoading,
  residencyStats,
  residencyPartners,
  residencyLeaders,
  companyLogoMap,
}: GawkResidencyTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At residency partner</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? '--' : residencyStats?.atResidencyPartner || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dataLoading ? 'Loading...' : `${residencyStats?.residencyPercentage ?? 0}% of eligible profiles`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not at partner</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? '--' : residencyStats?.notAtResidencyPartner || 0}
            </div>
            <p className="text-xs text-muted-foreground">Alumni/admin outside residency partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active partners</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? '--' : residencyPartners.length}
            </div>
            <p className="text-xs text-muted-foreground">Used for persistence / popularity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataLoading ? (
            <div className="flex items-center justify-center py-8 col-span-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : residencyLeaders.length > 0 ? (
            residencyLeaders.map((partner) => {
              const logoUrl = companyLogoMap
                ? getCompanyLogoUrl(partner.name, companyLogoMap)
                : null;
              return (
                <div key={partner.name} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <CompanyLogo
                      name={partner.name}
                      logoUrl={logoUrl}
                      size="sm"
                    />
                    <Badge variant="outline">{partner.count} ppl</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>BSc</span>
                    <span className="font-medium">{partner.bscCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>MSc</span>
                    <span className="font-medium">{partner.mscCount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {partner.percentage}% of eligible alumni
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No residency partner matches yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

