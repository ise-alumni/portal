import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Profile, EventData, Announcement } from '@/lib/types';
import { type ResidencyPartner, type ResidencyStats } from '@/lib/types/residency';
import { type SignInData, type FieldChange } from '@/lib/domain/profiles';
import { 
  getProfiles, 
  getAlumniProfiles,
  getEvents, 
  getAnnouncements,
  getProfileHistory,
  getProfileHistoryStats,
  getSignInsOverTime,
  getAllFieldChanges,
  getRecentFieldChanges,
  getResidencyPartners,
  getResidencyStats,
  createResidencyPartner,
  updateResidencyPartner,
  deleteResidencyPartner,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  isProfileComplete,
  isEventInPast,
  isEventUpcoming,
  isEventOngoing,
  isAnnouncementExpired,
  isAnnouncementActive
} from '@/lib/domain';
import { 
  filterData, 
  sortData, 
  paginateData, 
  type FilterOptions, 
  type SortOption, 
  type PaginationOptions,
  DEFAULT_PAGINATION
} from '@/lib/utils/data';
import { formatDate, formatDateShort, isDateWithinLastDays } from '@/lib/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  Calendar, 
  Megaphone, 
  Home,
  Plus,
  TrendingUp,
  UserPlus,
  Loader2,
  History,
  Activity,
  Building,
  Edit,
  Trash2,
  Eye,
  Filter
} from 'lucide-react';

// Helper function to render profile avatar or initials
const renderProfileAvatar = (profile: Profile, size: string = "w-8 h-8") => {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${profile.full_name || "User"} avatar`}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  } else {
    return (
      <div className={`${size} bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm`}>
        {profile.full_name ? profile.full_name.split(' ').map(word => word[0]).join('').toUpperCase() : 'U'}
      </div>
    );
  }
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [alumniProfiles, setAlumniProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Analytics states
  const [profileHistoryStats, setProfileHistoryStats] = useState<{
    totalChanges: number;
    changesByMonth: { month: string; count: number }[];
    changesByType: { type: string; count: number }[];
    topChangedFields: { field: string; count: number }[];
  } | null>(null);
  const [signInsData, setSignInsData] = useState<SignInData[]>([]);
  const [fieldChanges, setFieldChanges] = useState<FieldChange[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  // Residency states
  const [residencyPartners, setResidencyPartners] = useState<ResidencyPartner[]>([]);
  const [residencyStats, setResidencyStats] = useState<ResidencyStats | null>(null);
  const [residencyLoading, setResidencyLoading] = useState(true);
  
  // Tags states
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  
  // Residency partner modal states
  const [isCreatePartnerModalOpen, setIsCreatePartnerModalOpen] = useState(false);
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ResidencyPartner | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    website: '',
    logo_url: '',
    description: '',
    is_active: true
  });
  
  // Pagination and filtering states
  const [usersPagination, setUsersPagination] = useState<PaginationOptions>(DEFAULT_PAGINATION);
  const [eventsPagination, setEventsPagination] = useState<PaginationOptions>(DEFAULT_PAGINATION);
  const [announcementsPagination, setAnnouncementsPagination] = useState<PaginationOptions>(DEFAULT_PAGINATION);
  const [residencyPagination, setResidencyPagination] = useState<PaginationOptions>(DEFAULT_PAGINATION);
  
  const [usersFilter, setUsersFilter] = useState<FilterOptions>({});
  const [eventsFilter, setEventsFilter] = useState<FilterOptions>({});
  const [announcementsFilter, setAnnouncementsFilter] = useState<FilterOptions>({});
  const [residencyFilter, setResidencyFilter] = useState<FilterOptions>({});
  
  const [usersSort, setUsersSort] = useState<SortOption>({ field: 'full_name', direction: 'asc' });
  const [eventsSort, setEventsSort] = useState<SortOption>({ field: 'start_at', direction: 'desc' });
  const [announcementsSort, setAnnouncementsSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [residencySort, setResidencySort] = useState<SortOption>({ field: 'name', direction: 'asc' });



  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        log.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !profile) return;
      
      try {
        setDataLoading(true);
        const [profilesData, alumniProfilesData, eventsData, announcementsData] = await Promise.all([
          getProfiles(),
          getAlumniProfiles(),
          getEvents(),
          getAnnouncements()
        ]);
        
        setProfiles(profilesData);
        setAlumniProfiles(alumniProfilesData);
        setEvents(eventsData);
        setAnnouncements(announcementsData);
      } catch (error) {
        log.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile]);

  // Calculate statistics
  const calculateStats = () => {
    const totalUsers = profiles.length; // Use all profiles including staff for total count
    const completeProfiles = alumniProfiles.filter(isProfileComplete).length;
    const upcomingEvents = events.filter(isEventUpcoming).length;
    const ongoingEvents = events.filter(isEventOngoing).length;
    const activeAnnouncements = announcements.filter(isAnnouncementActive).length;
    const recentUsers = alumniProfiles.filter(p => isDateWithinLastDays(p.created_at, 30)).length;
    
    return {
      totalUsers,
      completeProfiles,
      upcomingEvents,
      ongoingEvents,
      activeAnnouncements,
      recentUsers,
      profileCompletionRate: totalUsers > 0 ? Math.round((completeProfiles / totalUsers) * 100) : 0
    };
  };

  const stats = calculateStats();

  // Get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Recent users (last 7 days) - use alumni profiles
    const recentUsers = alumniProfiles
      .filter(p => isDateWithinLastDays(p.created_at, 7))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        type: 'user',
        title: `New user: ${p.full_name || 'Anonymous'}`,
        description: p.bio || 'No bio provided',
        timestamp: p.created_at,
        icon: UserPlus,
        color: 'text-green-600'
      }));
    
    // Recent events (last 7 days)
    const recentEvents = events
      .filter(e => isDateWithinLastDays(e.created_at, 7))
      .slice(0, 3)
      .map(e => ({
        id: e.id,
        type: 'event',
        title: `New event: ${e.title}`,
        description: e.description || 'No description',
        timestamp: e.created_at,
        icon: Calendar,
        color: 'text-blue-600'
      }));
    
    // Recent announcements (last 7 days)
    const recentAnnouncements = announcements
      .filter(a => isDateWithinLastDays(a.created_at, 7))
      .slice(0, 3)
      .map(a => ({
        id: a.id,
        type: 'announcement',
        title: `New announcement: ${a.title}`,
        description: a.content || 'No content',
        timestamp: a.created_at,
        icon: Megaphone,
        color: 'text-purple-600'
      }));
    
    return [...recentUsers, ...recentEvents, ...recentAnnouncements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user || !profile) return;
      
      try {
        setAnalyticsLoading(true);
        const [stats, signIns, changes] = await Promise.all([
          getProfileHistoryStats(),
          getSignInsOverTime(30),
          getAllFieldChanges()
        ]);
        
        setProfileHistoryStats(stats);
        setSignInsData(signIns);
        setFieldChanges(changes);
      } catch (error) {
        log.error('Error fetching analytics data:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, profile]);

  // Fetch residency data
  useEffect(() => {
    const fetchResidencyData = async () => {
      if (!user || !profile) return;
      
      try {
        setResidencyLoading(true);
        const [partners, stats] = await Promise.all([
          getResidencyPartners(),
          getResidencyStats(profiles) // Pass all profiles, function will filter internally
        ]);
        
        setResidencyPartners(partners);
        setResidencyStats(stats);
      } catch (error) {
        log.error('Error fetching residency data:', error);
      } finally {
        setResidencyLoading(false);
      }
    };

    fetchResidencyData();
  }, [user, profile, profiles]);

  // Fetch tags data
  useEffect(() => {
    const fetchTagsData = async () => {
      if (!user || !profile) return;
      
      try {
        setTagsLoading(true);
        const tagsData = await getTags();
        setTags(tagsData);
      } catch (error) {
        log.error('Error fetching tags data:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTagsData();
  }, [user, profile]);

  // Residency partner handlers
  const handleCreatePartner = async () => {
    try {
      const newPartner = await createResidencyPartner({
        name: partnerForm.name,
        website: partnerForm.website || null,
        logo_url: partnerForm.logo_url || null,
        description: partnerForm.description || null,
        is_active: partnerForm.is_active
      });
      
      if (newPartner) {
        setResidencyPartners([...residencyPartners, newPartner]);
        setIsCreatePartnerModalOpen(false);
        setPartnerForm({
          name: '',
          website: '',
          logo_url: '',
          description: '',
          is_active: true
        });
      }
    } catch (error) {
      log.error('Error creating partner:', error);
    }
  };

  const handleUpdatePartner = async () => {
    if (!selectedPartner) return;
    
    try {
      const updatedPartner = await updateResidencyPartner(selectedPartner.id, {
        name: partnerForm.name,
        website: partnerForm.website || null,
        logo_url: partnerForm.logo_url || null,
        description: partnerForm.description || null,
        is_active: partnerForm.is_active
      });
      
      if (updatedPartner) {
        setResidencyPartners(residencyPartners.map(p => p.id === selectedPartner.id ? updatedPartner : p));
        setIsEditPartnerModalOpen(false);
        setSelectedPartner(null);
        setPartnerForm({
          name: '',
          website: '',
          logo_url: '',
          description: '',
          is_active: true
        });
      }
    } catch (error) {
      log.error('Error updating partner:', error);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this residency partner?')) return;
    
    try {
      const deleted = await deleteResidencyPartner(partnerId);
      if (deleted) {
        setResidencyPartners(residencyPartners.filter(p => p.id !== partnerId));
      }
    } catch (error) {
      log.error('Error deleting partner:', error);
    }
  };

  const openEditModal = (partner: ResidencyPartner) => {
    setSelectedPartner(partner);
    setPartnerForm({
      name: partner.name,
      website: partner.website || '',
      logo_url: partner.logo_url || '',
      description: partner.description || '',
      is_active: partner.is_active
    });
    setIsEditPartnerModalOpen(true);
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to auth
  }

  // Check if user has Admin or Staff role
  if (!['Admin', 'Staff'].includes(profile.user_type)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile.full_name || 'Admin'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="residency" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Residency</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Tags</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                            {renderProfileAvatar(profile, "w-8 h-8")}
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
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Recent Sign-ins */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Sign-ins</CardTitle>
                  <CardDescription>
                    Users who have signed in within the last 7 days
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={usersFilter.search || ''}
                    onChange={(e) => setUsersFilter({ ...usersFilter, search: e.target.value })}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                 <div className="space-y-4">
                   {(() => {
                     // For recent sign-ins, use all profiles (including staff)
                     const filteredProfiles = filterData(profiles, usersFilter, ['full_name', 'email', 'company']);
                     const sortedProfiles = sortData(filteredProfiles, usersSort);
                     const paginatedProfiles = paginateData(sortedProfiles, usersPagination);
                     
                      return paginatedProfiles.data.map((profile) => (
                       <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                         <div className="flex items-center space-x-3">
                           {renderProfileAvatar(profile, "w-8 h-8")}
                           <div>
                             <p className="font-medium">{profile.full_name || 'Unknown User'}</p>
                             <p className="text-sm text-muted-foreground">{profile.email}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium">Last active</p>
                           <p className="text-xs text-muted-foreground">
                             {formatDateShort(profile.updated_at)}
                           </p>
                         </div>
                       </div>
                     ));
                  })()}
                  {profiles.filter(p => isDateWithinLastDays(p.updated_at, 7)).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent sign-ins to display</p>
                    </div>
                  )}
                  
                   {/* Pagination */}
                   <div className="flex items-center justify-between mt-4">
                     <div className="text-sm text-muted-foreground">
                       Showing {usersPagination.page} of {Math.ceil(profiles.length / usersPagination.limit)} pages
                     </div>
                     <div className="flex space-x-2">
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => setUsersPagination({ ...usersPagination, page: Math.max(1, usersPagination.page - 1) })}
                         disabled={usersPagination.page <= 1}
                       >
                         Previous
                       </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setUsersPagination({ ...usersPagination, page: usersPagination.page + 1 })}
                          disabled={usersPagination.page >= Math.ceil(profiles.length / usersPagination.limit)}
                        >
                          Next
                        </Button>
                     </div>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>
                    Profile changes recorded in the last 7 days
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (() => {
                const recentUpdates = fieldChanges
                  .filter(change => isDateWithinLastDays(change.changedAt, 7))
                  .slice(0, 10);

                return recentUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {recentUpdates.map((change) => {
                      const profile = profiles.find(p => p.email === change.userEmail);
                      return (
                        <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {renderProfileAvatar(profile || { full_name: change.userName, avatar_url: null }, "w-8 h-8")}
                            <div>
                              <p className="font-medium">{change.userName}</p>
                              <p className="text-sm text-muted-foreground">{change.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {change.fieldName}
                              </Badge>
                              {change.changeType === 'INSERT' ? (
                                <Badge variant="default" className="text-xs">
                                  Added
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Updated
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-green-600">
                              {change.newValue}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateShort(change.changedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent profile updates to display</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                 <div>
                   <CardTitle>Event Management</CardTitle>
                   <CardDescription>
                     Create and manage events
                   </CardDescription>
                 </div>
                 <div className="flex space-x-2">
                   <Input
                     placeholder="Search events..."
                     value={eventsFilter.search || ''}
                     onChange={(e) => setEventsFilter({ ...eventsFilter, search: e.target.value })}
                     className="w-64"
                   />
                   <Button variant="outline" size="sm">
                     <Filter className="h-4 w-4 mr-2" />
                     Filter
                   </Button>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const filteredEvents = filterData(events, eventsFilter, ['title', 'description', 'location']);
                    const sortedEvents = sortData(filteredEvents, eventsSort);
                    const paginatedEvents = paginateData(sortedEvents, eventsPagination);
                    
                    return paginatedEvents.data.map((event) => {
                      const isPast = isEventInPast(event);
                      const isOngoing = isEventOngoing(event);
                      
                      return (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.location || 'No location'} • {formatDateShort(event.start_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isPast ? "secondary" : isOngoing ? "default" : "outline"}>
                              {isPast ? 'Past' : isOngoing ? 'Ongoing' : 'Upcoming'}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}?action=edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}?action=delete`)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No events to display</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {eventsPagination.page} of {Math.ceil(events.length / eventsPagination.limit)} pages
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={eventsPagination.page === 1}
                        onClick={() => setEventsPagination({ ...eventsPagination, page: Math.max(1, eventsPagination.page - 1) })}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={eventsPagination.page >= Math.ceil(events.length / eventsPagination.limit)}
                        onClick={() => setEventsPagination({ ...eventsPagination, page: eventsPagination.page + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                 <div>
                   <CardTitle>Announcement Management</CardTitle>
                   <CardDescription>
                     Create and manage announcements
                   </CardDescription>
                 </div>
                 <div className="flex space-x-2">
                   <Input
                     placeholder="Search announcements..."
                     value={announcementsFilter.search || ''}
                     onChange={(e) => setAnnouncementsFilter({ ...announcementsFilter, search: e.target.value })}
                     className="w-64"
                   />
                   <Button variant="outline" size="sm">
                     <Filter className="h-4 w-4 mr-2" />
                     Filter
                   </Button>
                 </div>

              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const filteredAnnouncements = filterData(announcements, announcementsFilter, ['title', 'content']);
                    const sortedAnnouncements = sortData(filteredAnnouncements, announcementsSort);
                    const paginatedAnnouncements = paginateData(sortedAnnouncements, announcementsPagination);
                    
                    return paginatedAnnouncements.data.map((announcement) => {
                    const isExpired = isAnnouncementExpired(announcement);
                    const isActive = isAnnouncementActive(announcement);
                    
                    return (
                      <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Megaphone className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {announcement.deadline ? `Deadline: ${formatDateShort(announcement.deadline)}` : 'No deadline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={isExpired ? "destructive" : isActive ? "default" : "secondary"}>
                            {isExpired ? 'Expired' : isActive ? 'Active' : 'Draft'}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}?action=edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}?action=delete`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                    });
                  })()}
                  {announcements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No announcements to display</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {announcementsPagination.page} of {Math.ceil(announcements.length / announcementsPagination.limit)} pages
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={announcementsPagination.page <= 1}
                        onClick={() => setAnnouncementsPagination({ ...announcementsPagination, page: Math.max(1, announcementsPagination.page - 1) })}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={announcementsPagination.page >= Math.ceil(announcements.length / announcementsPagination.limit)}
                        onClick={() => setAnnouncementsPagination({ ...announcementsPagination, page: announcementsPagination.page + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residency" className="space-y-4">
          {/* Residency Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Residency Partner</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {residencyLoading ? '--' : residencyStats?.atResidencyPartner || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {residencyLoading ? 'Loading...' : `${residencyStats?.residencyPercentage || 0}% of total`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not at Partner</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {residencyLoading ? '--' : residencyStats?.notAtResidencyPartner || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {residencyLoading ? '--' : residencyPartners.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Residency partners
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Residency Partners Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Residency Partners</CardTitle>
                  <CardDescription>
                    Manage residency partner organizations
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search partners..."
                    value={residencyFilter.search || ''}
                    onChange={(e) => setResidencyFilter({ ...residencyFilter, search: e.target.value })}
                    className="w-64"
                  />
                  <Dialog open={isCreatePartnerModalOpen} onOpenChange={setIsCreatePartnerModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Residency Partner</DialogTitle>
                        <DialogDescription>
                          Add a new residency partner organization to the system.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={partnerForm.name}
                            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                            placeholder="Enter partner name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={partnerForm.website}
                            onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="logo_url">Logo URL</Label>
                          <Input
                            id="logo_url"
                            type="url"
                            value={partnerForm.logo_url}
                            onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={partnerForm.description}
                            onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                            placeholder="Brief description of the partner organization"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={partnerForm.is_active}
                            onCheckedChange={(checked) => setPartnerForm({ ...partnerForm, is_active: checked })}
                          />
                          <Label htmlFor="is_active">Active</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleCreatePartner}>
                          Create Partner
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {residencyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                   {(() => {
                    // Get partner stats from residencyStats
                    const partnersWithStats = residencyPartners.map(partner => {
                      const partnerStat = residencyStats?.partners.find(p => p.name === partner.name);
                      return {
                        ...partner,
                        bscCount: partnerStat?.bscCount || 0,
                        mscCount: partnerStat?.mscCount || 0,
                        totalCount: partnerStat?.count || 0
                      };
                    });
                    
                    const filteredPartners = filterData(partnersWithStats, residencyFilter, ['name', 'website', 'description']);
                    const sortedPartners = filteredPartners.sort((a, b) => b.totalCount - a.totalCount);
                    const paginatedPartners = paginateData(sortedPartners, residencyPagination);
                    
                    return paginatedPartners.data.map((partner) => (
                      <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {partner.logo_url && (
                            <img 
                              src={partner.logo_url} 
                              alt={partner.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {partner.website ? (
                                <a 
                                  href={partner.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {partner.website}
                                </a>
                              ) : (
                                'No website'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {partner.bscCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              BSC: {partner.bscCount}
                            </Badge>
                          )}
                          {partner.mscCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              MSC: {partner.mscCount}
                            </Badge>
                          )}
                          <Badge variant={partner.is_active ? "default" : "secondary"}>
                            {partner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePartner(partner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ));
                  })()}
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {residencyPagination.page} of {Math.ceil(residencyPartners.length / residencyPagination.limit)} pages
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setResidencyPagination({ ...residencyPagination, page: residencyPagination.page - 1 })}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setResidencyPagination({ ...residencyPagination, page: residencyPagination.page + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Partner Modal */}
          <Dialog open={isEditPartnerModalOpen} onOpenChange={setIsEditPartnerModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Residency Partner</DialogTitle>
                <DialogDescription>
                  Update the residency partner information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    placeholder="Enter partner name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={partnerForm.website}
                    onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-logo_url">Logo URL</Label>
                  <Input
                    id="edit-logo_url"
                    type="url"
                    value={partnerForm.logo_url}
                    onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={partnerForm.description}
                    onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                    placeholder="Brief description of the partner organization"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_active"
                    checked={partnerForm.is_active}
                    onCheckedChange={(checked) => setPartnerForm({ ...partnerForm, is_active: checked })}
                  />
                  <Label htmlFor="edit-is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleUpdatePartner}>
                  Update Partner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tag Management</CardTitle>
                  <CardDescription>
                    Create and manage tags for events and announcements
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="New tag name..."
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className="w-48"
                  />
                  <Input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-20 h-9"
                  />
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (!newTag.name.trim()) return;
                      
                      const createdTag = await createTag(newTag.name, newTag.color);
                      if (createdTag) {
                        setTags([...tags, createdTag]);
                        setNewTag({ name: '', color: '#3B82F6' });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Color</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="text-sm font-mono">{tag.color}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="font-medium">{tag.name}</span>
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={async () => {
                                  const newName = prompt('Edit tag name:', tag.name);
                                  if (newName && newName.trim()) {
                                    const updatedTag = await updateTag(tag.id, newName.trim(), tag.color);
                                    if (updatedTag) {
                                      setTags(tags.map(t => t.id === tag.id ? updatedTag : t));
                                    }
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete tag "${tag.name}"?`)) {
                                    const deleted = await deleteTag(tag.id);
                                    if (deleted) {
                                      setTags(tags.filter(t => t.id !== tag.id));
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
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
                  className="h-64"
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
                      {fieldChanges.map((change) => (
                        <tr key={change.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{change.userName}</p>
                              <p className="text-sm text-muted-foreground">{change.userEmail}</p>
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
                      ))}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
