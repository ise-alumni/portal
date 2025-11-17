import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CalendarIcon, MapPinIcon, Loader2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import NewEventModal from "@/components/NewEventModal";

// Import centralized types and utilities
import { type EventData, type Tag } from "@/lib/types";
import { getEvents, getTags, isEventInPast, isEventUpcoming } from "@/lib/domain";
import { formatDate } from "@/lib/utils/date";
import { getRandomEventImage } from "@/lib/utils/images";

const ExistingEvent = ({ event }: { event: EventData }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };

  const imageUrl = event.image_url || getRandomEventImage();

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to another random image if first one fails
            const target = e.target as HTMLImageElement;
            target.src = getRandomEventImage();
          }}
        />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {formatDate(event.start_at)}
        </div>
        {event.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPinIcon className="w-4 h-4 mr-1" />
            {event.location}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleViewDetails}>Details</Button>
      </CardContent>
    </Card>
  );
};

const Events = () => {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [eventView, setEventView] = useState<'upcoming' | 'past'>('upcoming');
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsData, tagsData] = await Promise.all([
        getEvents(),
        getTags()
      ]);

      console.log('Fetched events:', eventsData?.length, eventsData);
      console.log('Fetched tags:', tagsData?.length, tagsData);
      setEvents(eventsData);
      setAvailableTags(tagsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    // This function can be removed or replaced with a domain service later
    // For now, keeping it simple since user_type check is minimal
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
    
      if (error) {
        throw error;
      }

      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleEventCreated = () => {
    fetchEvents(); // Refresh events list
  };

  // Check if user can create events (admin or staff)
  const canCreateEvents = user && userProfile && (userProfile.user_type === 'Admin' || userProfile.user_type === 'Staff');

  // Filter and sort events
  const allUpcomingEvents = events.filter(event => isEventUpcoming(event));
  const allPastEvents = events.filter(event => isEventInPast(event));
  
  // Apply tag filtering to each group
  const upcomingEvents = allUpcomingEvents.filter(event => 
    !selectedTag || event.event_tags?.some(et => et.tags.name === selectedTag)
  ).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  const pastEvents = allPastEvents.filter(event => 
    !selectedTag || event.event_tags?.some(et => et.tags.name === selectedTag)
  ).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.start_at).getTime() - new Date(a.start_at).getTime(); // Past events sorted descending
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  // Debug logging
  console.log('Total events:', events.length);
  console.log('Upcoming events:', upcomingEvents.length, upcomingEvents.map(e => ({ title: e.title, date: e.start_at })));
  console.log('Past events:', pastEvents.length, pastEvents.map(e => ({ title: e.title, date: e.start_at })));

  // Pagination logic
  const totalUpcomingEvents = upcomingEvents.length;
  const totalPastEvents = pastEvents.length;
  
  const upcomingEventsPaginated = upcomingEvents.slice(
    (upcomingPage - 1) * itemsPerPage,
    upcomingPage * itemsPerPage
  );
  
  const pastEventsPaginated = pastEvents.slice(
    (pastPage - 1) * itemsPerPage,
    pastPage * itemsPerPage
  );

  const upcomingTotalPages = Math.ceil(totalUpcomingEvents / itemsPerPage);
  const pastTotalPages = Math.ceil(totalPastEvents / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setUpcomingPage(1);
    setPastPage(1);
  }, [selectedTag, sortBy]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2Icon className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={fetchEvents}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto"
          >
            <option value="date">Sort by Date</option>
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
          {canCreateEvents && (
            <Button onClick={() => setIsAddEventModalOpen(true)} className="w-full sm:w-auto">
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Past Events Toggle */}
      {pastEvents.length > 0 && (
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setEventView(eventView === 'upcoming' ? 'past' : 'upcoming');
              // Reset pagination when switching views
              if (eventView === 'upcoming') {
                setPastPage(1);
              } else {
                setUpcomingPage(1);
              }
            }}
            className="w-full sm:w-auto"
          >
            {eventView === 'upcoming' ? (
              <>Show Past Events ({pastEvents.length})</>
            ) : (
              <>Show Upcoming Events ({upcomingEvents.length})</>
            )}
          </Button>
        </div>
      )}

      {/* Upcoming Events Section */}
      {eventView === 'upcoming' && (
        <div className="mb-8">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No upcoming events scheduled.</p>
              {canCreateEvents && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setIsAddEventModalOpen(true)}
                >
                  Create First Event
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {upcomingEventsPaginated.map((event) => (
                  <ExistingEvent key={event.id} event={event} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {upcomingTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage(Math.max(1, upcomingPage - 1))}
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
                    onClick={() => setUpcomingPage(Math.min(upcomingTotalPages, upcomingPage + 1))}
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

      {/* Past Events Section */}
      {eventView === 'past' && pastEvents.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pastEventsPaginated.map((event) => (
              <ExistingEvent key={event.id} event={event} />
            ))}
          </div>
              
          {/* Pagination for Past Events */}
          {pastTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPastPage(Math.max(1, pastPage - 1))}
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
                onClick={() => setPastPage(Math.min(pastTotalPages, pastPage + 1))}
                disabled={pastPage === pastTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <NewEventModal 
        isOpen={isAddEventModalOpen} 
        onClose={() => setIsAddEventModalOpen(false)}
        onSubmit={handleEventCreated}
        mode="event"
      />
    </div>
  );
};

export default Events;
