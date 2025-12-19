import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Profile, EventData, Announcement } from '@/lib/types';
import { toast } from 'sonner';
import { type ResidencyPartner, type ResidencyStats } from '@/lib/types/residency';
import { type SignInData, type FieldChange, type UserActivity, getUserActivity } from '@/lib/domain/profiles';
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
  isAnnouncementActive,
  createUserWithProfile,
  removeUser,
  refreshUserData
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
  BarChart3,
} from 'lucide-react';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { DashboardUsersTab } from '@/components/dashboard/DashboardUsersTab';
import { DashboardEventsTab } from '@/components/dashboard/DashboardEventsTab';
import { DashboardAnnouncementsTab } from '@/components/dashboard/DashboardAnnouncementsTab';
import { DashboardResidencyTab } from '@/components/dashboard/DashboardResidencyTab';
import { DashboardTagsTab } from '@/components/dashboard/DashboardTagsTab';
import { DashboardAnalyticsTab } from '@/components/dashboard/DashboardAnalyticsTab';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  
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
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
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

  // User management modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isRemoveUserModalOpen, setIsRemoveUserModalOpen] = useState(false);
  const [selectedUserForRemoval, setSelectedUserForRemoval] = useState<UserActivity | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    fullName: '',
    graduationYear: '',
    userType: 'Alum' as 'Alum' | 'Admin' | 'Staff',
    msc: false
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


  // Fetch dashboard data, analytics, and tags (consolidated - all have same dependencies)
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user || !profile) return;
      
      try {
        // Set all loading states
        setDataLoading(true);
        setAnalyticsLoading(true);
        setTagsLoading(true);
        
        // Fetch all data in parallel
        const [
          profilesData,
          alumniProfilesData,
          eventsData,
          announcementsData,
          analyticsStats,
          signIns,
          changes,
          userActivityData,
          tagsData
        ] = await Promise.all([
          getProfiles(),
          getAlumniProfiles(),
          getEvents(),
          getAnnouncements(),
          getProfileHistoryStats(),
          getSignInsOverTime(30),
          getAllFieldChanges(),
          getUserActivity(),
          getTags()
        ]);
        
        // Set dashboard data
        setProfiles(profilesData);
        setAlumniProfiles(alumniProfilesData);
        setEvents(eventsData);
        setAnnouncements(announcementsData);
        
        // Set analytics data
        setProfileHistoryStats(analyticsStats);
        setSignInsData(signIns);
        setFieldChanges(changes);
        setUserActivity(userActivityData);
        
        // Set tags data
        setTags(tagsData);
      } catch (error) {
        log.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
        setAnalyticsLoading(false);
        setTagsLoading(false);
      }
    };

    fetchAllData();
  }, [user, profile]);

  // Calculate statistics with useMemo
  const stats = useMemo(() => {
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
  }, [profiles, alumniProfiles, events, announcements]);

  // Get recent activity with useMemo
  const recentActivity = useMemo(() => {
    // Recent users (last 7 days) - use alumni profiles
    const recentUsers = alumniProfiles
      .filter(p => isDateWithinLastDays(p.created_at, 7))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        type: 'user' as const,
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
        type: 'event' as const,
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
        type: 'announcement' as const,
        title: `New announcement: ${a.title}`,
        description: a.content || 'No content',
        timestamp: a.created_at,
        icon: Megaphone,
        color: 'text-purple-600'
      }));
    
    return [...recentUsers, ...recentEvents, ...recentAnnouncements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [alumniProfiles, events, announcements]);

  // Fetch residency data (separate effect - depends on profiles)
  useEffect(() => {
    const fetchResidencyData = async () => {
      if (!user || !profile || profiles.length === 0) return;
      
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

  // Residency partner handlers with useCallback
  const handleCreatePartner = useCallback(async () => {
    try {
      const newPartner = await createResidencyPartner({
        name: partnerForm.name,
        website: partnerForm.website || null,
        logo_url: partnerForm.logo_url || null,
        description: partnerForm.description || null,
        is_active: partnerForm.is_active
      });
      
      if (newPartner) {
        setResidencyPartners(prev => [...prev, newPartner]);
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
  }, [partnerForm]);

  const handleUpdatePartner = useCallback(async () => {
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
        setResidencyPartners(prev => prev.map(p => p.id === selectedPartner.id ? updatedPartner : p));
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
  }, [selectedPartner, partnerForm]);

  const handleDeletePartner = useCallback(async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this residency partner?')) return;
    
    try {
      const deleted = await deleteResidencyPartner(partnerId);
      if (deleted) {
        setResidencyPartners(prev => prev.filter(p => p.id !== partnerId));
      }
    } catch (error) {
      log.error('Error deleting partner:', error);
    }
  }, []);

  const openEditModal = useCallback((partner: ResidencyPartner) => {
    setSelectedPartner(partner);
    setPartnerForm({
      name: partner.name,
      website: partner.website || '',
      logo_url: partner.logo_url || '',
      description: partner.description || '',
      is_active: partner.is_active
    });
    setIsEditPartnerModalOpen(true);
  }, []);

  // User management handlers with useCallback
  const handleAddUser = useCallback(async () => {
    try {
      setIsAddingUser(true);
      
      const result = await createUserWithProfile({
        email: addUserForm.email,
        fullName: addUserForm.fullName,
        graduationYear: addUserForm.graduationYear,
        userType: addUserForm.userType,
        msc: addUserForm.msc,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Refresh data
      const { profiles: updatedProfiles, userActivity: updatedUserActivity } = await refreshUserData();
      setProfiles(updatedProfiles);
      setUserActivity(updatedUserActivity);

      // Reset form and close modal
      setAddUserForm({
        email: '',
        fullName: '',
        graduationYear: '',
        userType: 'Alum',
        msc: false
      });
      setIsAddUserModalOpen(false);
      toast.success('User created successfully');
    } catch (error) {
      log.error('Error adding user:', error);
      toast.error(`Error adding user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingUser(false);
    }
  }, [addUserForm]);

  const handleRemoveUser = useCallback(async () => {
    if (!selectedUserForRemoval?.profile) return;

    try {
      const success = await removeUser(selectedUserForRemoval.profile.id);
      
      if (!success) {
        throw new Error('Failed to remove user');
      }

      // Refresh data
      const { profiles: updatedProfiles, userActivity: updatedUserActivity } = await refreshUserData();
      setProfiles(updatedProfiles);
      setUserActivity(updatedUserActivity);

      // Reset and close modal
      setSelectedUserForRemoval(null);
      setIsRemoveUserModalOpen(false);
      
      toast.success('User removed successfully. They will no longer appear in the application and cannot sign in.');
    } catch (error) {
      log.error('Error removing user:', error);
      toast.error(`Error removing user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedUserForRemoval]);



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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.full_name || 'Admin'}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/gawk')}
        >
          <BarChart3 className="h-4 w-4" />
          Open Gawk
        </Button>
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
          <DashboardOverviewTab
            profiles={profiles}
            alumniProfiles={alumniProfiles}
            events={events}
            announcements={announcements}
            dataLoading={dataLoading}
            stats={stats}
            recentActivity={recentActivity}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <DashboardUsersTab
            userActivity={userActivity}
            profiles={profiles}
            usersFilter={usersFilter}
            usersPagination={usersPagination}
            setUsersFilter={setUsersFilter}
            setUsersPagination={setUsersPagination}
            handleAddUser={handleAddUser}
            handleRemoveUser={handleRemoveUser}
            dataLoading={dataLoading}
            isAddingUser={isAddingUser}
            isAddUserModalOpen={isAddUserModalOpen}
            setIsAddUserModalOpen={setIsAddUserModalOpen}
            isRemoveUserModalOpen={isRemoveUserModalOpen}
            setIsRemoveUserModalOpen={setIsRemoveUserModalOpen}
            selectedUserForRemoval={selectedUserForRemoval}
            setSelectedUserForRemoval={setSelectedUserForRemoval}
            addUserForm={addUserForm}
            setAddUserForm={setAddUserForm}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <DashboardEventsTab
            events={events}
            eventsFilter={eventsFilter}
            eventsSort={eventsSort}
            eventsPagination={eventsPagination}
            setEventsFilter={setEventsFilter}
            setEventsSort={setEventsSort}
            setEventsPagination={setEventsPagination}
            dataLoading={dataLoading}
          />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <DashboardAnnouncementsTab
            announcements={announcements}
            announcementsFilter={announcementsFilter}
            announcementsSort={announcementsSort}
            announcementsPagination={announcementsPagination}
            setAnnouncementsFilter={setAnnouncementsFilter}
            setAnnouncementsSort={setAnnouncementsSort}
            setAnnouncementsPagination={setAnnouncementsPagination}
            dataLoading={dataLoading}
          />
        </TabsContent>

        <TabsContent value="residency" className="space-y-4">
          <DashboardResidencyTab
            residencyPartners={residencyPartners}
            residencyStats={residencyStats}
            residencyFilter={residencyFilter}
            residencyPagination={residencyPagination}
            setResidencyFilter={setResidencyFilter}
            setResidencyPagination={setResidencyPagination}
            handleCreatePartner={handleCreatePartner}
            handleUpdatePartner={handleUpdatePartner}
            handleDeletePartner={handleDeletePartner}
            openEditModal={openEditModal}
            residencyLoading={residencyLoading}
            isCreatePartnerModalOpen={isCreatePartnerModalOpen}
            setIsCreatePartnerModalOpen={setIsCreatePartnerModalOpen}
            isEditPartnerModalOpen={isEditPartnerModalOpen}
            setIsEditPartnerModalOpen={setIsEditPartnerModalOpen}
            selectedPartner={selectedPartner}
            partnerForm={partnerForm}
            setPartnerForm={setPartnerForm}
          />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <DashboardTagsTab
            tags={tags}
            tagsLoading={tagsLoading}
            newTag={newTag}
            setNewTag={setNewTag}
            setTags={setTags}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DashboardAnalyticsTab
            profiles={profiles}
            profileHistoryStats={profileHistoryStats}
            signInsData={signInsData}
            fieldChanges={fieldChanges}
            analyticsLoading={analyticsLoading}
            dataLoading={dataLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
