import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Clock, MegaphoneIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewEventModal from '@/components/NewEventModal';
import { Announcement, type Tag } from '@/lib/types';
import { getAnnouncements } from '@/lib/domain/announcements';
import { getUserProfileType } from '@/lib/domain/profiles';
import { formatDateShort, isDateInPast, isDateWithinLastDays } from '@/lib/utils/date';
import { handleImageError } from '@/lib/utils/images';
import { filterAnnouncements, sortAnnouncements, type SortOption } from '@/lib/utils/data';
import { log } from '@/lib/utils/logger';
import { canUserCreateAnnouncements } from '@/lib/constants';
import { getTags } from '@/lib/domain';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { TagBadge } from '@/components/ui/tag-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/usePagination';
import { useFiltering } from '@/hooks/useFiltering';
import { useDataFetching } from '@/hooks/useDataFetching';


// Announcement Card Component
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/announcements/${announcement.id}`);
  };

  const imageUrl = announcement.image_url || `https://placehold.co/600x400?text=Announcement+${announcement.id}`;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={announcement.title}
          className="w-full h-full object-cover"
          onError={(e) => handleImageError(e)}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl leading-tight">{announcement.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {announcement.tags?.map((tag) => (
                <TagBadge 
                  key={tag.id} 
                  name={tag.name}
                  color={tag.color}
                />
              ))}
              {announcement.deadline && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Deadline: </span>
                  {formatDateShort(announcement.deadline)}
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateShort(announcement.created_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">
        </CardDescription>
        <div className="mt-4 space-y-2">
          <Button className="w-full" onClick={handleViewDetails}>Details</Button>
          {announcement.external_url && (
            <Button variant="outline" className="w-full" asChild>
              <a href={announcement.external_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Learn More
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const Announcements = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'deadline' | 'title'>('created_at');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [announcementView, setAnnouncementView] = useState<'current' | 'past'>('current');
  const [userProfile, setUserProfile] = useState<{ user_type: string } | null>(null);

  // Fetch announcements data
  const { data: announcements, loading, error, refetch } = useDataFetching(getAnnouncements);

  // Fetch tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  useEffect(() => {
    const fetchTags = async () => {
      const tagsData = await getTags();
      setAvailableTags(tagsData);
    };
    fetchTags();
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    const userType = await getUserProfileType(user.id);
    if (userType) {
      setUserProfile({ user_type: userType });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Use filtering hook
  const { filteredData, setFilters } = useFiltering(announcements || [], {
    searchFields: ['title', 'content']
  });

  // Apply tag filter
  useEffect(() => {
    const filters = selectedTag ? { tags: [selectedTag] } : {};
    setFilters(filters);
  }, [selectedTag, setFilters]);

  // Apply sorting - memoized
  const sortOption: SortOption = useMemo(() => ({
    field: sortBy,
    direction: sortBy === 'created_at' ? 'desc' : 'asc'
  }), [sortBy]);

  // Separate current/upcoming from past announcements - memoized
  const { currentAnnouncements, pastAnnouncements } = useMemo(() => {
    const current = (filteredData || []).filter(announcement => {
      if (announcement.deadline && !isDateInPast(announcement.deadline)) {
        return true;
      }
      if (!announcement.deadline && isDateWithinLastDays(announcement.created_at, 30)) {
        return true;
      }
      return false;
    });
    
    const past = (filteredData || []).filter(announcement => {
      if (announcement.deadline && isDateInPast(announcement.deadline)) {
        return true;
      }
      if (!announcement.deadline && !isDateWithinLastDays(announcement.created_at, 30)) {
        return true;
      }
      return false;
    });

    return { currentAnnouncements: current, pastAnnouncements: past };
  }, [filteredData]);

  // Use pagination hooks
  const upcomingPagination = usePagination(currentAnnouncements, { initialItemsPerPage: 6 });
  const pastPagination = usePagination(pastAnnouncements, { initialItemsPerPage: 6 });

  // Reset pagination when filters change
  useEffect(() => {
    upcomingPagination.resetPagination();
    pastPagination.resetPagination();
  }, [selectedTag, sortBy, upcomingPagination, pastPagination]);

  const handleCreateAnnouncement = useCallback(async (data: unknown) => {
    if (!user?.id) return;

    log.info('Announcement created successfully');
    setIsModalOpen(false);
    refetch(); // Refresh announcements list
  }, [user?.id, refetch]);

  const canCreateAnnouncement = useMemo(() => 
    canUserCreateAnnouncements(userProfile?.user_type || null),
    [userProfile]
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Announcements</h1>
        <LoadingSpinner text="Loading announcements..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Announcements</h1>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Announcements</h1>
         <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
           <select
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value as 'created_at' | 'deadline' | 'title')}
             className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
           >
             <option value="created_at">Sort by Date</option>
             <option value="deadline">Sort by Deadline</option>
             <option value="title">Sort by Title</option>
           </select>
           <select
           value={selectedTag}
           onChange={(e) => setSelectedTag(e.target.value)}
           className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
           >
           <option value="">All Tags</option>
           {availableTags.map(tag => (
           <option key={tag.id} value={tag.name}>{tag.name}</option>
           ))}
           </select>
            <select
              value={upcomingPagination.itemsPerPage}
              onChange={(e) => {
                const newItemsPerPage = Number(e.target.value);
                upcomingPagination.setItemsPerPage(newItemsPerPage);
                pastPagination.setItemsPerPage(newItemsPerPage);
              }}
              className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
           {canCreateAnnouncement && (
             <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
               Create Announcement
             </Button>
           )}
         </div>
      </div>

      {/* Past Announcements Toggle */}
      {pastAnnouncements.length > 0 && (
        <div className="mb-6">
           <Button 
             variant="outline" 
             onClick={() => {
               setAnnouncementView(announcementView === 'current' ? 'past' : 'current');
               // Reset pagination when switching views
               if (announcementView === 'current') {
                 pastPagination.resetPagination();
               } else {
                 upcomingPagination.resetPagination();
               }
             }}
             className="w-full sm:w-auto"
           >
             {announcementView === 'current' ? `Show Past Announcements (${pastAnnouncements.length})` : `Show Current Announcements (${currentAnnouncements.length})`}
           </Button>
        </div>
      )}
      {/* Current/Upcoming Announcements */}
      {announcementView === 'current' && (
        <div className="mb-8">
          {currentAnnouncements.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <MegaphoneIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No current announcements.</p>
              {canCreateAnnouncement && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setIsModalOpen(true)}
                >
                  Create First Announcement
                </Button>
              )}
            </div>
          ) : (
            <>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {upcomingPagination.paginatedData.map((announcement) => (
                   <AnnouncementCard key={announcement.id} announcement={announcement} />
                 ))}
               </div>
              
               {/* Pagination for Current Announcements */}
               <upcomingPagination.PaginationComponent 
                 data={currentAnnouncements}
                 totalItems={currentAnnouncements.length}
               />
            </>
          )}
        </div>
      )}


      {/* Past Announcements */}
      {announcementView === 'past' && pastAnnouncements.length > 0 && (
        <div className="mb-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {pastPagination.paginatedData.map((announcement) => (
               <div key={announcement.id} className="opacity-75">
                 <AnnouncementCard announcement={announcement} />
               </div>
             ))}
           </div>
              
           {/* Pagination for Past Announcements */}
           <pastPagination.PaginationComponent 
             data={pastAnnouncements}
             totalItems={pastAnnouncements.length}
           />
        </div>
      )}

      {isModalOpen && (
        <NewEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateAnnouncement}
          mode="announcement"
        />
      )}
    </div>
  );
}
