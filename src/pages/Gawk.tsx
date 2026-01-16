import { useEffect, useMemo, useState, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldAlert, BarChart3, RefreshCcw, Home } from 'lucide-react';
import { log } from '@/lib/utils/logger';
import { buildCompanyLogoMap } from '@/lib/utils/companyLogo';
import { useUserProfile } from '@/hooks/useUserProfile';

// Import extracted tab components
import { GawkOverviewTab } from '@/components/gawk/GawkOverviewTab';
import { GawkEmploymentTab } from '@/components/gawk/GawkEmploymentTab';
import { GawkMobilityTab } from '@/components/gawk/GawkMobilityTab';
import { GawkResidencyTab } from '@/components/gawk/GawkResidencyTab';
import { GawkLeaderboardsTab } from '@/components/gawk/GawkLeaderboardsTab';

const Gawk = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

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
  const [companyLogoMap, setCompanyLogoMap] = useState<ReturnType<typeof buildCompanyLogoMap> | null>(null);


  const fetchAnalytics = useCallback(async () => {
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
      if (partners && partners.length > 0) {
        setCompanyLogoMap(buildCompanyLogoMap(partners));
      }

      const resStats = await getResidencyStats(nonStaffProfiles);
      setResidencyStats(resStats);
    } catch (error) {
      log.error('Error loading gawk analytics:', error);
    } finally {
      setAnalyticsLoading(false);
      setDataLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
          <GawkOverviewTab
            analyticsLoading={analyticsLoading}
            historyStats={historyStats}
            totalSignIns={totalSignIns}
            uniqueRecentUsers={uniqueRecentUsers}
            signIns={signIns}
            recentHistory={recentHistory}
          />
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <GawkEmploymentTab
            employmentBreakdown={employmentBreakdown}
            fieldChangeFrequency={fieldChangeFrequency}
            topJobTitles={topJobTitles}
            cohortBreakdown={cohortBreakdown}
            cohortProgramBreakdown={cohortProgramBreakdown}
            dataLoading={dataLoading}
            analyticsLoading={analyticsLoading}
          />
        </TabsContent>

        <TabsContent value="mobility" className="space-y-4">
          <GawkMobilityTab
            locationLeaders={locationLeaders}
            recentMovers={recentMovers}
            profiles={profiles}
            dataLoading={dataLoading}
            analyticsLoading={analyticsLoading}
          />
        </TabsContent>

        <TabsContent value="residency" className="space-y-4">
          <GawkResidencyTab
            dataLoading={dataLoading}
            residencyStats={residencyStats}
            residencyPartners={residencyPartners}
            residencyLeaders={residencyLeaders}
            companyLogoMap={companyLogoMap}
          />
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <GawkLeaderboardsTab
            analyticsLoading={analyticsLoading}
            dataLoading={dataLoading}
            leaderboards={leaderboards}
            residencyLeaders={residencyLeaders}
            championCompanies={championCompanies}
            destinationCities={destinationCities}
            companyLogoMap={companyLogoMap}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Gawk;