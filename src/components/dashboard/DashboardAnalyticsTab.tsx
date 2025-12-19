import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Loader2, Users, Activity, History } from 'lucide-react';
import { Profile, FieldChange, SignInData } from '@/lib/types';
import { formatDate, formatDateShort, isDateWithinLastDays } from '@/lib/utils/date';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from 'recharts';

interface ProfileHistoryStats {
  totalChanges: number;
  changesByMonth: { month: string; count: number }[];
  changesByType: { type: string; count: number }[];
  topChangedFields: { field: string; count: number }[];
}

interface DashboardAnalyticsTabProps {
  profiles: Profile[];
  profileHistoryStats: ProfileHistoryStats | null;
  signInsData: SignInData[];
  fieldChanges: FieldChange[];
  analyticsLoading: boolean;
  dataLoading: boolean;
}

export function DashboardAnalyticsTab({
  profiles,
  profileHistoryStats,
  signInsData,
  fieldChanges,
  analyticsLoading,
  dataLoading,
}: DashboardAnalyticsTabProps) {
  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? '--' : profiles.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataLoading ? '--' : profiles.filter(p => isDateWithinLastDays(p.updated_at, 1)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Changes</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '--' : profileHistoryStats?.totalChanges || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sign-ins Over Time Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Sign-ins Over Time</CardTitle>
          <CardDescription>
            Daily user activity for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : signInsData.length > 0 ? (
            <ChartContainer
              config={{
                count: {
                  label: "Sign-ins",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-64 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signInsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--color-count)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-count)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No sign-in data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Changes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Profile Changes</CardTitle>
          <CardDescription>
            Latest field updates by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : fieldChanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">User</th>
                    <th className="text-left p-2 font-medium">Field</th>
                    <th className="text-left p-2 font-medium">Change</th>
                    <th className="text-left p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldChanges.map((change) => {
                    const profileMatch = profiles.find(
                      (p) => p.email && p.email.toLowerCase() === change.userEmail.toLowerCase()
                    );
                    return (
                      <tr key={change.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <ProfileAvatar
                              src={profileMatch?.avatar_url}
                              fullName={profileMatch?.full_name || change.userName}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">{change.userName}</p>
                              <p className="text-sm text-muted-foreground">{change.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{change.fieldName}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="max-w-xs">
                            {change.changeType === 'INSERT' ? (
                              <span className="text-green-600">Added: {change.newValue}</span>
                            ) : (
                              <span className="text-blue-600">Updated to: {change.newValue}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <p>{formatDateShort(change.changedAt)}</p>
                            <p className="text-muted-foreground">{formatDate(change.changedAt)}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No recent profile changes to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

