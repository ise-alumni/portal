import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, ExternalLink, Clock } from 'lucide-react';
import NewEventModal from '@/components/NewEventModal';

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  type: string;
  external_url: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

type NewAnnouncement = {
  title: string;
  content: string | null;
  type: 'opportunity' | 'news' | 'lecture' | 'program';
  external_url: string | null;
  deadline: string | null;
};

export const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'deadline' | 'title'>('created_at');
  const [selectedType, setSelectedType] = useState<string>('');
  const [announcementView, setAnnouncementView] = useState<'current' | 'past'>('current');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Pagination state for current announcements
  const [currentAnnouncementsPage, setCurrentAnnouncementsPage] = useState(1);
  const [currentAnnouncementsPerPage, setCurrentAnnouncementsPerPage] = useState(6);
  
  // Pagination state for past announcements
  const [pastAnnouncementsPage, setPastAnnouncementsPage] = useState(1);
  const [pastAnnouncementsPerPage, setPastAnnouncementsPerPage] = useState(6);

  useEffect(() => {
    fetchAnnouncements();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Apply filtering and sorting when dependencies change
    const processedAnnouncements = announcements.filter(announcement => {
      return !selectedType || announcement.type === selectedType;
    });

    const sortedAnnouncements = [...processedAnnouncements].sort((a, b) => {
      if (sortBy === 'deadline') {
        // Handle null deadlines - put them last
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredAnnouncements(sortedAnnouncements);
  }, [announcements, selectedType, sortBy]);

  // Separate current/upcoming from past announcements
  const now = new Date();
  const currentAnnouncements = filteredAnnouncements.filter(announcement => {
    // Consider announcements with deadlines in the future as current
    if (announcement.deadline && new Date(announcement.deadline) >= now) {
      return true;
    }
    // Consider announcements without deadlines as current if created within last 30 days
    if (!announcement.deadline && new Date(announcement.created_at) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      return true;
    }
    return false;
  });
  
  const pastAnnouncements = filteredAnnouncements.filter(announcement => {
    // Consider announcements with past deadlines as past
    if (announcement.deadline && new Date(announcement.deadline) < now) {
      return true;
    }
    // Consider announcements without deadlines as past if created more than 30 days ago
    if (!announcement.deadline && new Date(announcement.created_at) < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      return true;
    }
    return false;
  });

  // Pagination calculations for current announcements
  const currentAnnouncementsTotalPages = Math.ceil(currentAnnouncements.length / currentAnnouncementsPerPage);
  const currentAnnouncementsStartIndex = (currentAnnouncementsPage - 1) * currentAnnouncementsPerPage;
  const currentAnnouncementsEndIndex = currentAnnouncementsStartIndex + currentAnnouncementsPerPage;
  const paginatedCurrentAnnouncements = currentAnnouncements.slice(currentAnnouncementsStartIndex, currentAnnouncementsEndIndex);

  // Pagination calculations for past announcements
  const pastAnnouncementsTotalPages = Math.ceil(pastAnnouncements.length / pastAnnouncementsPerPage);
  const pastAnnouncementsStartIndex = (pastAnnouncementsPage - 1) * pastAnnouncementsPerPage;
  const pastAnnouncementsEndIndex = pastAnnouncementsStartIndex + pastAnnouncementsPerPage;
  const paginatedPastAnnouncements = pastAnnouncements.slice(pastAnnouncementsStartIndex, pastAnnouncementsEndIndex);

  // Debug logging
  console.log('Total announcements:', announcements.length);
  console.log('Current announcements:', currentAnnouncements.length);
  console.log('Past announcements:', pastAnnouncements.length);
  console.log('Current page:', currentAnnouncementsPage, 'Total pages:', currentAnnouncementsTotalPages);
  console.log('Past page:', pastAnnouncementsPage, 'Total pages:', pastAnnouncementsTotalPages);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentAnnouncementsPage(1);
    setPastAnnouncementsPage(1);
  }, [selectedType, sortBy]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();
    
    setUserProfile(profile);
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*'); 

    if (error) {
      console.error('Error fetching announcements:', error);
    } else {
      console.log('Fetched announcements:', data?.length, data);
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const handleCreateAnnouncement = async (announcement: NewAnnouncement) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcement,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
    } else {
      console.log('Announcement created:', data);
      setIsModalOpen(false);
      fetchAnnouncements(); // Refresh announcements list
    }
  };

  const canCreateAnnouncement = userProfile?.user_type === 'Admin' || userProfile?.user_type === 'Staff';

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'news':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lecture':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'program':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'Opportunity';
      case 'news':
        return 'News';
      case 'lecture':
        return 'Guest Lecture';
      case 'program':
        return 'Program';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading announcements...</p>
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
          >
            <option value="">All Types</option>
            <option value="opportunity">Opportunity</option>
            <option value="news">News</option>
            <option value="lecture">Guest Lecture</option>
            <option value="program">Program</option>
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
                setPastAnnouncementsPage(1);
              } else {
                setCurrentAnnouncementsPage(1);
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
              <p className="text-muted-foreground">No current announcements.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {paginatedCurrentAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl leading-tight">{announcement.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={getTypeColor(announcement.type)}>
                              {getTypeLabel(announcement.type)}
                            </Badge>
                            {announcement.deadline && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Deadline: </span>
                                {new Date(announcement.deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {announcement.content}
                      </CardDescription>
                      {announcement.external_url && (
                        <div className="mt-4">
                          <Button variant="outline" asChild>
                            <a href={announcement.external_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Learn More
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination for Current Announcements */}
              {currentAnnouncementsTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <select
                      value={currentAnnouncementsPerPage}
                      onChange={(e) => {
                        setCurrentAnnouncementsPerPage(Number(e.target.value));
                        setCurrentAnnouncementsPage(1);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentAnnouncementsPage(prev => Math.max(1, prev - 1))}
                      disabled={currentAnnouncementsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentAnnouncementsPage} of {currentAnnouncementsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentAnnouncementsPage(prev => Math.min(currentAnnouncementsTotalPages, prev + 1))}
                      disabled={currentAnnouncementsPage === currentAnnouncementsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* Past Announcements */}
      {announcementView === 'past' && pastAnnouncements.length > 0 && (
        <div className="mb-8">
          <div className="grid gap-6">
            {paginatedPastAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="w-full opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl leading-tight">{announcement.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={getTypeColor(announcement.type)}>
                          {getTypeLabel(announcement.type)}
                        </Badge>
                        {announcement.deadline && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Deadline: </span>
                            {new Date(announcement.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {announcement.content}
                  </CardDescription>
                  {announcement.external_url && (
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <a href={announcement.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
              
          {/* Pagination for Past Announcements */}
          {pastAnnouncementsTotalPages > 1 && (
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
               <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">Items per page:</span>
                 <select
                   value={pastAnnouncementsPerPage}
                   onChange={(e) => {
                     setPastAnnouncementsPerPage(Number(e.target.value));
                     setPastAnnouncementsPage(1);
                   }}
                   className="px-2 py-1 border rounded text-sm"
                 >
                   <option value={10}>10</option>
                   <option value={15}>15</option>
                   <option value={25}>25</option>
                   <option value={50}>50</option>
                 </select>
               </div>
               <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setPastAnnouncementsPage(prev => Math.max(1, prev - 1))}
                   disabled={pastAnnouncementsPage === 1}
                 >
                   Previous
                 </Button>
                 <span className="text-sm">
                   Page {pastAnnouncementsPage} of {pastAnnouncementsTotalPages}
                 </span>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setPastAnnouncementsPage(prev => Math.min(pastAnnouncementsTotalPages, prev + 1))}
                   disabled={pastAnnouncementsPage === pastAnnouncementsTotalPages}
                 >
                   Next
                 </Button>
               </div>
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
