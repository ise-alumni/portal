import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, Megaphone, TrendingUp, UserPlus } from 'lucide-react';
import { Profile, EventData, Announcement } from '@/lib/types';
import { formatDate } from '@/lib/utils/date';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: typeof Users;
  color: string;
}

interface Stats {
  totalUsers: number;
  completeProfiles: number;
  upcomingEvents: number;
  ongoingEvents: number;
  activeAnnouncements: number;
  recentUsers: number;
  profileCompletionRate: number;
}

interface DashboardOverviewTabProps {
  profiles: Profile[];
  alumniProfiles: Profile[];
  events: EventData[];
  announcements: Announcement[];
  dataLoading: boolean;
  stats: Stats;
  recentActivity: RecentActivity[];
}

export function DashboardOverviewTab({
  profiles,
  alumniProfiles,
  events,
  announcements,
  dataLoading,
  stats,
  recentActivity,
}: DashboardOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? '--' : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {dataLoading ? 'Loading...' : `+${stats.recentUsers} this month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? '--' : stats.upcomingEvents + stats.ongoingEvents}</div>
            <p className="text-xs text-muted-foreground">
              {dataLoading ? 'Loading...' : `${stats.ongoingEvents} ongoing, ${stats.upcomingEvents} upcoming`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? '--' : stats.activeAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              {dataLoading ? 'Loading...' : 'Currently active'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? '--' : `${stats.profileCompletionRate}%`}</div>
            <p className="text-xs text-muted-foreground">
              {dataLoading ? 'Loading...' : `${stats.completeProfiles}/${stats.totalUsers} complete`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin/Staff Users and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin & Staff Users</CardTitle>
            <CardDescription>
              System administrators and staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {profiles
                  .filter(p => ['Admin', 'Staff'].includes(p.user_type))
                  .slice(0, 5)
                  .map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ProfileAvatar
                          src={profile.avatar_url}
                          fullName={profile.full_name || 'Unknown User'}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{profile.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {profile.user_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {profiles.filter(p => ['Admin', 'Staff'].includes(p.user_type)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No admin or staff users found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

