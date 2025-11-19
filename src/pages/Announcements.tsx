import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Clock, MegaphoneIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewEventModal from '@/components/NewEventModal';
import { Announcement, NewAnnouncement, type Tag } from '@/lib/types';
import { getAnnouncements, createAnnouncement } from '@/lib/domain/announcements';
import { formatDateShort, isDateInPast, isDateWithinLastDays } from '@/lib/utils/date';
import { filterAnnouncements, sortAnnouncements, type SortOption } from '@/lib/utils/data';
import { log } from '@/lib/utils/logger';
import { canUserCreateContent } from '@/lib/constants';
import { getTags } from '@/lib/domain';
import { getEventTagColorClass } from '@/lib/utils/ui';

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
          onError={(e) => {
            // Fallback to another random image if first one fails
            const target = e.target as HTMLImageElement;
            const randomId = Math.floor(Math.random() * 1000);
            target.src = `https://placehold.co/600x400?text=Announcement+${randomId}`;
          }}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl leading-tight">{announcement.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {announcement.tags?.map((tag, index) => (
                <Badge 
                  key={index} 
                  style={{ 
                    backgroundColor: tag.color + '20',
                    borderColor: tag.color,
                    color: tag.color 
                  }}
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
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
          {announcement.content}
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'deadline' | 'title'>('created_at');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [announcementView, setAnnouncementView] = useState<'current' | 'past'>('current');
  const [userProfile, setUserProfile] = useState<{ user_type: string } | null>(null);
  
   // Pagination state
   const [upcomingPage, setUpcomingPage] = useState(1);
   const [pastPage, setPastPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(6);

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();
    
    setUserProfile(profile);
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
    fetchUserProfile();
    fetchTags();
  }, [fetchUserProfile]);

  const fetchTags = async () => {
    const tagsData = await getTags();
    setAvailableTags(tagsData);
  };

  useEffect(() => {
    // Apply filtering and sorting when dependencies change
    const filters = {
      // Add tag filter when selectedTag is not empty
      ...(selectedTag && { tags: [selectedTag] })
    };

    const sortOption: SortOption = {
      field: sortBy,
      direction: sortBy === 'created_at' ? 'desc' : 'asc'
    };

    const filtered = filterAnnouncements(announcements, filters);
    const sorted = sortAnnouncements(filtered, sortOption);

    setFilteredAnnouncements(sorted);
  }, [announcements, selectedTag, sortBy]);

   // Separate current/upcoming from past announcements
   const currentAnnouncements = filteredAnnouncements.filter(announcement => {
     // Consider announcements with deadlines in the future as current
     if (announcement.deadline && !isDateInPast(announcement.deadline)) {
       return true;
     }
     // Consider announcements without deadlines as current if created within last 30 days
     if (!announcement.deadline && isDateWithinLastDays(announcement.created_at, 30)) {
       return true;
     }
     return false;
   });
   
   const pastAnnouncements = filteredAnnouncements.filter(announcement => {
     // Consider announcements with past deadlines as past
     if (announcement.deadline && isDateInPast(announcement.deadline)) {
       return true;
     }
     // Consider announcements without deadlines as past if created more than 30 days ago
     if (!announcement.deadline && !isDateWithinLastDays(announcement.created_at, 30)) {
       return true;
     }
     return false;
   });

   // Pagination calculations
   const upcomingTotalPages = Math.ceil(currentAnnouncements.length / itemsPerPage);
   const pastTotalPages = Math.ceil(pastAnnouncements.length / itemsPerPage);
   
   const paginatedCurrentAnnouncements = currentAnnouncements.slice(
     (upcomingPage - 1) * itemsPerPage,
     upcomingPage * itemsPerPage
   );
   
   const paginatedPastAnnouncements = pastAnnouncements.slice(
     (pastPage - 1) * itemsPerPage,
     pastPage * itemsPerPage
   );

    // Debug logging
    log.debug('Total announcements:', announcements.length);
    log.debug('Current announcements:', currentAnnouncements.length);
    log.debug('Past announcements:', pastAnnouncements.length);
    log.debug('Current page:', upcomingPage, 'Total pages:', upcomingTotalPages);
    log.debug('Past page:', pastPage, 'Total pages:', pastTotalPages);

   // Reset pagination when filters change
   useEffect(() => {
     setUpcomingPage(1);
     setPastPage(1);
   }, [selectedTag, sortBy]);

   const fetchAnnouncements = async () => {
    const data = await getAnnouncements();
     log.debug('Fetched announcements:', data.length, data);
    setAnnouncements(data);
    setLoading(false);
  };

  const handleCreateAnnouncement = async (data: any) => {
    if (!user) return;

    // Convert AnnouncementData to NewAnnouncement format
    const announcement: NewAnnouncement = {
      title: data.title,
      content: data.content,
      external_url: data.external_url,
      deadline: data.deadline,
      image_url: data.image_url,
      tag_ids: data.tag_ids,
    };

    const result = await createAnnouncement(announcement, user.id);
    
    if (result) {
      log.info('Announcement created:', result);
      setIsModalOpen(false);
      fetchAnnouncements(); // Refresh announcements list
    } else {
      log.error('Error creating announcement');
    }
  };

  const canCreateAnnouncement = canUserCreateContent(userProfile?.user_type || null);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Announcements</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
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
             value={itemsPerPage}
             onChange={(e) => {
               setItemsPerPage(Number(e.target.value));
               setUpcomingPage(1);
               setPastPage(1);
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
                setPastPage(1);
              } else {
                setUpcomingPage(1);
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
                {paginatedCurrentAnnouncements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
              
              {/* Pagination for Current Announcements */}
              {upcomingTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage(prev => Math.max(1, prev - 1))}
                    disabled={upcomingPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {upcomingPage} of {upcomingTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage(prev => Math.min(upcomingTotalPages, prev + 1))}
                    disabled={upcomingPage === upcomingTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* Past Announcements */}
      {announcementView === 'past' && pastAnnouncements.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {paginatedPastAnnouncements.map((announcement) => (
              <div key={announcement.id} className="opacity-75">
                <AnnouncementCard announcement={announcement} />
              </div>
            ))}
          </div>
              
          {/* Pagination for Past Announcements */}
          {pastTotalPages > 1 && (
             <div className="flex justify-center items-center gap-2 mt-6">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setPastPage(prev => Math.max(1, prev - 1))}
                 disabled={pastPage === 1}
               >
                 Previous
               </Button>
               <span className="text-sm text-muted-foreground">
                 Page {pastPage} of {pastTotalPages}
               </span>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setPastPage(prev => Math.min(pastTotalPages, prev + 1))}
                 disabled={pastPage === pastTotalPages}
               >
                 Next
               </Button>
             </div>
           )}
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
