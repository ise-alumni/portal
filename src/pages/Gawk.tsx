import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { type Profile } from '@/lib/types';
import { 
  type ProfileHistory, 
  type SignInData, 
  type UserActivity, 
  getProfileHistory, 
  getProfileHistoryStats,
  getSignInsOverTime, 
  getUserActivity 
} from '@/lib/domain/profiles';
import { getProfiles } from '@/lib/domain/profiles';
import { getResidencyPartners, getResidencyStats } from '@/lib/domain/residency';
import { type ResidencyPartner, type ResidencyStats } from '@/lib/types/residency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, ShieldAlert, BarChart3, RefreshCcw, Home, MapPin, Briefcase } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { formatDateShort } from '@/lib/utils/date';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';

const Gawk = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [historyStats, setHistoryStats] = useState<{
    totalChanges: number;
    changesByMonth: { month: string; count: number }[];
    changesByType: { type: string; count: number }[];
    topChangedFields: { field: string; count: number }[];
  } | null>(null);
  const [signIns, setSignIns] = useState<SignInData[]>([]);
  const [history, setHistory] = useState<ProfileHistory[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [residencyStats, setResidencyStats] = useState<ResidencyStats | null>(null);
  const [residencyPartners, setResidencyPartners] = useState<ResidencyPartner[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        log.error('Error fetching profile in Gawk:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !profile) return;

      try {
        setAnalyticsLoading(true);
        setDataLoading(true);

        const [signInData, historyData, activity, profilesData, partners, stats] = await Promise.all([
          getSignInsOverTime(90),
          getProfileHistory(),
          getUserActivity(),
          getProfiles(),
          getResidencyPartners(),
          getProfileHistoryStats()
        ]);

        const nonStaffProfiles = profilesData.filter(p => p.user_type !== 'Staff');
        setProfiles(nonStaffProfiles);

        const allowedIds = new Set(nonStaffProfiles.map(p => p.id));
        const filteredHistory = historyData.filter(h => allowedIds.has(h.profile_id));
        setHistory(filteredHistory);

        setHistoryStats(stats);

        const filteredActivity = activity.filter(a => a.profile?.user_type !== 'Staff');
        setUserActivity(filteredActivity);

        setSignIns(signInData);
        setResidencyPartners(partners);

        const resStats = await getResidencyStats(nonStaffProfiles);
        setResidencyStats(resStats);
      } catch (error) {
        log.error('Error loading gawk analytics:', error);
      } finally {
        setAnalyticsLoading(false);
        setDataLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, profile]);

  const totalSignIns = useMemo(
    () => signIns.reduce((sum, entry) => sum + entry.count, 0),
    [signIns]
  );

  const uniqueRecentUsers = useMemo(
    () => userActivity.filter(u => u.lastSignInAt).length,
    [userActivity]
  );

  const recentHistory = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    return sorted.slice(0, 8);
  }, [history]);

  const residencyLeaders = useMemo(() => residencyStats?.partners.slice(0, 5) || [], [residencyStats]);

  const employmentBreakdown = useMemo(() => {
    const compute = (list: Profile[]) => {
      const employed = list.filter(p => p.professional_status === 'employed').length;
      const entrepreneur = list.filter(p => p.professional_status === 'entrepreneur' || p.is_entrepreneur).length;
      const open = list.filter(p => p.professional_status === 'open_to_work').length;
      const unknown = Math.max(list.length - (employed + entrepreneur + open), 0);
      return { employed, entrepreneur, open, unknown, total: list.length };
    };

    const overall = compute(profiles);
    const bsc = compute(profiles.filter(p => !p.msc));
    const msc = compute(profiles.filter(p => p.msc));

    return [
      { segment: 'Overall', ...overall },
      { segment: 'BSc', ...bsc },
      { segment: 'MSc', ...msc },
    ];
  }, [profiles]);

  const fieldChangesByMonth = useMemo(() => historyStats?.changesByMonth || [], [historyStats]);

  const fieldChangeFrequency = useMemo(
    () => historyStats?.topChangedFields || [],
    [historyStats]
  );

  const topJobTitles = useMemo(() => {
    const counts = profiles.reduce<Record<string, number>>((acc, profile) => {
      if (!profile.job_title) return acc;
      const title = profile.job_title.trim();
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));
  }, [profiles]);

  const locationLeaders = useMemo(() => {
    const cityCounts = profiles.reduce<Record<string, number>>((acc, profile) => {
      if (!profile.city) return acc;
      const key = profile.country ? `${profile.city}, ${profile.country}` : profile.city;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    history.forEach(entry => {
      if (!entry.city) return;
      const key = entry.country ? `${entry.city}, ${entry.country}` : entry.city;
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
  }, [profiles, history]);

  const recentMovers = useMemo(() => {
    if (history.length === 0 || profiles.length === 0) return [];

    const byProfile = history.reduce<Record<string, ProfileHistory[]>>((acc, entry) => {
      const list = acc[entry.profile_id] || [];
      list.push(entry);
      acc[entry.profile_id] = list;
      return acc;
    }, {});

    const movers = Object.entries(byProfile).map(([id, entries]) => {
      const sorted = [...entries].sort(
        (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      );

      const steps: { cityLabel: string; changedAt: string }[] = [];
      let lastLabel: string | null = null;

      sorted.forEach((e) => {
        if (!e.city && !e.country) return;
        const label = e.city ? (e.country ? `${e.city}, ${e.country}` : e.city) : e.country!;
        if (label === lastLabel) return;
        lastLabel = label;
        steps.push({ cityLabel: label, changedAt: e.changed_at });
      });

      const profile = profiles.find((p) => p.id === id);
      if (profile?.city || profile?.country) {
        const label = profile.city
          ? profile.country
            ? `${profile.city}, ${profile.country}`
            : profile.city
          : profile.country!;
        if (label !== lastLabel) {
          steps.push({ cityLabel: label, changedAt: profile.updated_at });
        }
      }

      const distinctCities = new Set(steps.map((s) => s.cityLabel));

      return {
        id,
        name: profile?.full_name || 'Unknown user',
        path: steps,
        cityCount: distinctCities.size,
        lastChangedAt: steps.length ? steps[steps.length - 1].changedAt : null,
      };
    });

    return movers
      .filter((m) => m && m.cityCount > 1)
      .sort((a, b) => {
        if (!a.lastChangedAt || !b.lastChangedAt) return 0;
        return new Date(b.lastChangedAt).getTime() - new Date(a.lastChangedAt).getTime();
      })
      .slice(0, 8);
  }, [history, profiles]);

  const championCompanies = useMemo(() => {
    const counts: Record<string, number> = {};

    profiles.forEach((profile) => {
      if (!profile.is_ise_champion || !profile.company) return;
      const company = profile.company.trim();
      if (!company) return;
      counts[company] = (counts[company] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));
  }, [profiles]);

  const destinationCities = useMemo(() => {
    if (profiles.length === 0) return [];

    const historyByProfile = history.reduce<Record<string, ProfileHistory[]>>(
      (acc, entry) => {
        const list = acc[entry.profile_id] || [];
        list.push(entry);
        acc[entry.profile_id] = list;
        return acc;
      },
      {}
    );

    const cityCounts: Record<string, number> = {};

    profiles.forEach((profile) => {
      const entries = historyByProfile[profile.id] || [];
      let label: string | null = null;

      if (entries.length > 0) {
        const sorted = [...entries].sort(
          (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
        );
        const last = sorted[sorted.length - 1];
        if (last.city || last.country) {
          label = last.city
            ? last.country
              ? `${last.city}, ${last.country}`
              : last.city
            : last.country!;
        }
      }

      if (profile.city || profile.country) {
        label = profile.city
          ? profile.country
            ? `${profile.city}, ${profile.country}`
            : profile.city
          : profile.country!;
      }

      if (!label) return;
      cityCounts[label] = (cityCounts[label] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
  }, [history, profiles]);

  const cohortBreakdown = useMemo(() => {
    const grouped = profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      const cohort = profile.cohort ? profile.cohort.toString() : 'Unknown';
      acc[cohort] = acc[cohort] ? [...acc[cohort], profile] : [profile];
      return acc;
    }, {});

    return Object.entries(grouped).map(([cohort, list]) => {
      const employed = list.filter(p => p.professional_status === 'employed').length;
      const entrepreneur = list.filter(p => p.professional_status === 'entrepreneur' || p.is_entrepreneur).length;
      const open = list.filter(p => p.professional_status === 'open_to_work').length;
      const total = list.length || 1;
      const employedRate = Math.round((employed / total) * 100);
      const entrepreneurRate = Math.round((entrepreneur / total) * 100);
      const openRate = Math.round((open / total) * 100);
      return { cohort, employedRate, entrepreneurRate, openRate, total };
    }).sort((a, b) => a.cohort.localeCompare(b.cohort));
  }, [profiles]);

  const cohortProgramBreakdown = useMemo(() => {
    const grouped = profiles.reduce<Record<string, Profile[]>>((acc, profile) => {
      const cohort = profile.cohort ? profile.cohort.toString() : 'Unknown';
      acc[cohort] = acc[cohort] ? [...acc[cohort], profile] : [profile];
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([cohort, list]) => {
        const bscCount = list.filter(p => !p.msc).length;
        const mscCount = list.filter(p => p.msc).length;
        const total = list.length || 1;
        const bscRate = Math.round((bscCount / total) * 100);
        const mscRate = Math.round((mscCount / total) * 100);
        return { cohort, bscCount, mscCount, bscRate, mscRate, total };
      })
      .sort((a, b) => a.cohort.localeCompare(b.cohort));
  }, [profiles]);

  const leaderboards = useMemo(() => {
    const byProfile = history.reduce<Record<string, ProfileHistory[]>>((acc, entry) => {
      acc[entry.profile_id] = acc[entry.profile_id] ? [...acc[entry.profile_id], entry] : [entry];
      return acc;
    }, {});

    const getProfileForId = (id: string) => profiles.find(p => p.id === id) || null;

    const getProfileName = (id: string) => getProfileForId(id)?.full_name || 'Unknown user';
    const getProfileAvatar = (id: string) => getProfileForId(id)?.avatar_url || null;

    const historyCounts = Object.entries(byProfile)
      .map(([id, entries]) => ({
        id,
        name: getProfileName(id),
        avatarUrl: getProfileAvatar(id),
        count: entries.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const jetsetters = Object.entries(byProfile).map(([id, entries]) => {
      const cities = new Set<string>();
      entries.forEach(e => {
        if (e.city) {
          cities.add(e.country ? `${e.city}, ${e.country}` : e.city);
        }
      });
      const profileCity = getProfileForId(id)?.city;
      if (profileCity) cities.add(profileCity);
      return {
        id,
        name: getProfileName(id),
        avatarUrl: getProfileAvatar(id),
        cityCount: cities.size,
      };
    }).sort((a, b) => b.cityCount - a.cityCount).slice(0, 3);

    const employerHoppers = Object.entries(byProfile).map(([id, entries]) => {
      const companies = new Set<string>();
      entries.forEach(e => e.company && companies.add(e.company));
      const profileCompany = getProfileForId(id)?.company;
      if (profileCompany) companies.add(profileCompany);
      return {
        id,
        name: getProfileName(id),
        avatarUrl: getProfileAvatar(id),
        companyCount: companies.size,
      };
    }).sort((a, b) => b.companyCount - a.companyCount).slice(0, 3);

    return { historyCounts, jetsetters, employerHoppers };
  }, [history, profiles]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Gawk...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (!['Admin', 'Staff'].includes(profile.user_type)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Gawk is restricted to Staff and Admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button className="w-full" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gawk</h1>
          <p className="text-muted-foreground">
            Experimental analytics for alumni history, employment, mobility, and partners.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="mobility">Mobility</TabsTrigger>
          <TabsTrigger value="residency">Residency</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment & entrepreneurship rate</CardTitle>
                <CardDescription>Overall vs BSc vs MSc</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      employed: { label: 'Employed', color: 'hsl(var(--chart-1))' },
                      entrepreneur: { label: 'Entrepreneur', color: 'hsl(var(--chart-2))' },
                      open: { label: 'Open to work', color: 'hsl(var(--chart-3))' },
                      unknown: { label: 'Unknown', color: 'hsl(var(--chart-4))' },
                    }}
                    className="h-64"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employmentBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="employed" stackId="a" fill="hsl(var(--primary))" />
                        <Bar dataKey="entrepreneur" stackId="a" fill="hsl(var(--primary))" />
                        <Bar dataKey="open" stackId="a" fill="hsl(var(--primary))" />
                        <Bar dataKey="unknown" stackId="a" fill="hsl(var(--muted-foreground))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field change frequency</CardTitle>
                <CardDescription>Which profile fields are being updated the most</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : fieldChangeFrequency.length > 0 ? (
                  <ChartContainer
                    config={{
                      count: { label: 'Changes', color: 'hsl(var(--chart-1))' },
                    }}
                    className="h-64"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fieldChangeFrequency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="field" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No change data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top job titles</CardTitle>
                <CardDescription>Most common current titles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : topJobTitles.length > 0 ? (
                  topJobTitles.map((item) => (
                    <div key={item.title} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No job title data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cohort / program breakdown</CardTitle>
              <CardDescription>Employment + entrepreneurship share by cohort</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cohortBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohort data yet</p>
              ) : cohortBreakdown.map((row) => (
                <div key={row.cohort} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Cohort {row.cohort}</p>
                    <Badge variant="outline">{row.total} ppl</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Employed</span>
                      <span className="font-medium">{row.employedRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrepreneur</span>
                      <span className="font-medium">{row.entrepreneurRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open to work</span>
                      <span className="font-medium">{row.openRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cohort / program mix</CardTitle>
              <CardDescription>BSc vs MSc share within each cohort</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cohortProgramBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohort data yet</p>
              ) : cohortProgramBreakdown.map((row) => (
                <div key={row.cohort} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Cohort {row.cohort}</p>
                    <Badge variant="outline">{row.total} ppl</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>BSc</span>
                      <span className="font-medium">
                        {row.bscCount} ({row.bscRate}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>MSc</span>
                      <span className="font-medium">
                        {row.mscCount} ({row.mscRate}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobility" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Location leaders</CardTitle>
                <CardDescription>Top cities touched by profiles or history</CardDescription>
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
        </TabsContent>

        <TabsContent value="residency" className="space-y-4">
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
              <CardTitle>Most popular residency partners</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataLoading ? (
                <div className="flex items-center justify-center py-8 col-span-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : residencyLeaders.length > 0 ? (
                residencyLeaders.map((partner) => (
                  <div key={partner.name} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{partner.name}</p>
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
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No residency partner matches yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>“Biggest gawker”</CardTitle>
                <CardDescription>Most history entries (proxy for edits/engagement)</CardDescription>
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
                  residencyLeaders.slice(0, 3).map((partner) => (
                    <div key={partner.name} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex flex-col">
                        <p className="font-medium">{partner.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {partner.percentage}% of eligible alumni
                        </span>
                      </div>
                      <Badge variant="outline">{partner.count} ppl</Badge>
                    </div>
                  ))
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
                  championCompanies.map((item) => (
                    <div key={item.company} className="flex items-center justify-between p-2 border rounded-lg">
                      <p className="font-medium">{item.company}</p>
                      <Badge variant="outline">{item.count} champions</Badge>
                    </div>
                  ))
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Gawk;
