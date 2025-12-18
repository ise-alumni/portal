import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import NewEventModal from "@/components/NewEventModal";

// Import centralized types and utilities
import { type EventData, type Tag } from "@/lib/types";
import { getEvents, getTags, isEventInPast, isEventUpcoming, isEventOngoing } from "@/lib/domain";
import { formatDate } from "@/lib/utils/date";
import { log } from '@/lib/utils/logger';
import { canUserCreateEvents } from '@/lib/constants';
import { usePagination } from '@/hooks/usePagination';
import { useFiltering } from '@/hooks/useFiltering';
import { useDataFetching } from '@/hooks/useDataFetching';

const ExistingEvent = ({ event }: { event: EventData }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };

  const imageUrl = event.image_url || `https://placehold.co/600x400?text=Event+${event.id}`;

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
            const randomId = Math.floor(Math.random() * 1000);
            target.src = `https://placehold.co/600x400?text=Event+${randomId}`;
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
        {event.event_tags && event.event_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.event_tags.map((eventTag) => (
              <Badge 
                key={eventTag.tags.id} 
                style={{ 
                  backgroundColor: eventTag.tags.color + '20',
                  borderColor: eventTag.tags.color,
                  color: eventTag.tags.color 
                }}
                className="text-xs"
              >
                {eventTag.tags.name}
              </Badge>
            ))}
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
  const [userProfile, setUserProfile] = useState<{ user_type?: string } | null>(null);
  const [eventView, setEventView] = useState<'upcoming' | 'past'>('upcoming');
  const { user } = useAuth();

  // Fetch events data
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useDataFetching(getEvents);

  // Use filtering hook
  const { filteredData, setFilters } = useFiltering(eventsData || [], {
    searchFields: ['title', 'description', 'location']
  });

  const fetchUserProfile = useCallback(async () => {
    // This function can be removed or replaced with a domain service later
    // For now, keeping it simple since user_type check is minimal
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
    
if (eventsError) {
        throw error;
      }

      setUserProfile(data);
    } catch (err) {
      log.error('Error fetching user profile:', err);
    }
  }, [user]);

  useEffect(() => {
    refetchEvents();
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile, refetchEvents]);

  const handleEventCreated = () => {
    refetchEvents(); // Refresh events list
  };

  // Check if user can create events (admin only)
  const canCreateEvents = user && userProfile && canUserCreateEvents(userProfile.user_type);

  // Apply tag filter
  useEffect(() => {
    const filters = selectedTag ? { tags: [selectedTag] } : {};
    setFilters(filters);
  }, [selectedTag, setFilters]);

  // Filter and sort events
  const allCurrentEvents = (filteredData || []).filter(event => 
    isEventUpcoming(event) || isEventOngoing(event)
  );
  const allPastEvents = (filteredData || []).filter(event => isEventInPast(event));
  
  // Apply sorting
  const upcomingEvents = allCurrentEvents.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  const pastEvents = allPastEvents.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.start_at).getTime() - new Date(a.start_at).getTime(); // Past events sorted descending
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  // Debug logging
  log.debug('Total events:', events.length);
  log.debug('Upcoming events:', upcomingEvents.length, upcomingEvents.map(e => ({ title: e.title, date: e.start_at })));
  log.debug('Past events:', pastEvents.length, pastEvents.map(e => ({ title: e.title, date: e.start_at })));

  // Use pagination hooks
  const upcomingPagination = usePagination(upcomingEvents, { initialItemsPerPage: 15 });
  const pastPagination = usePagination(pastEvents, { initialItemsPerPage: 15 });

  // Reset pagination when filters change
  useEffect(() => {
    upcomingPagination.resetPagination();
    pastPagination.resetPagination();
  }, [selectedTag, sortBy, upcomingPagination, pastPagination]);

  if (eventsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Events</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {eventsError?.message || 'Failed to load events'}</p>
          <Button onClick={refetchEvents}>Try Again</Button>
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
                pastPagination.resetPagination();
              } else {
                upcomingPagination.resetPagination();
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
                {upcomingPagination.paginatedData.map((event) => (
                  <ExistingEvent key={event.id} event={event} />
                ))}
              </div>
              
              {/* Pagination for Upcoming Events */}
              <upcomingPagination.PaginationComponent 
                data={upcomingEvents}
                totalItems={upcomingEvents.length}
              />
            </>
          )}
        </div>
      )}

      {/* Past Events Section */}
      {eventView === 'past' && pastEvents.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pastPagination.paginatedData.map((event) => (
              <div key={event.id} className="opacity-75">
                <ExistingEvent event={event} />
              </div>
            ))}
          </div>
              
          {/* Pagination for Past Events */}
          <pastPagination.PaginationComponent 
            data={pastEvents}
            totalItems={pastEvents.length}
          />
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
