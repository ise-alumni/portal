import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Loader2, BarChart3, Home } from 'lucide-react';
import { SignInData, ProfileHistory } from '@/lib/types';
import { formatDateShort } from '@/lib/utils/date';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface HistoryStats {
  totalChanges: number;
  changesByMonth: { month: string; count: number }[];
  changesByType: { type: string; count: number }[];
  topChangedFields: { field: string; count: number }[];
}

interface GawkOverviewTabProps {
  analyticsLoading: boolean;
  historyStats: HistoryStats | null;
  totalSignIns: number;
  uniqueRecentUsers: number;
  signIns: SignInData[];
  recentHistory: ProfileHistory[];
}

export function GawkOverviewTab({
  analyticsLoading,
  historyStats,
  totalSignIns,
  uniqueRecentUsers,
  signIns,
  recentHistory,
}: GawkOverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile changes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '--' : historyStats?.totalChanges || 0}
            </div>
            <p className="text-xs text-muted-foreground">All-time tracked updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sign-ins (90d)</CardTitle>
            <Loader2 className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '--' : totalSignIns}
            </div>
            <p className="text-xs text-muted-foreground">Total auth events in last 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent unique users</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '--' : uniqueRecentUsers}
            </div>
            <p className="text-xs text-muted-foreground">Users with a recorded sign-in</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign-ins over time</CardTitle>
            <CardDescription>90-day activity trend (auth events)</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : signIns.length > 0 ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Sign-ins",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signIns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No sign-in data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest profile history slices</CardTitle>
            <CardDescription>Lightweight peek at recent `profiles_history` rows</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{entry.job_title || 'Role TBD'}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.company || 'Company n/a'} • {entry.city || 'City n/a'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {entry.professional_status && (
                          <Badge variant="outline" className="text-xs">
                            {entry.professional_status}
                          </Badge>
                        )}
                        {entry.change_type && (
                          <Badge variant={entry.change_type === 'INSERT' ? 'default' : 'secondary'} className="text-xs">
                            {entry.change_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDateShort(entry.changed_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No history records to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

