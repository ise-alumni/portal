import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { CalendarIcon, MapPinIcon, Loader2Icon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import NewEventModal from "@/components/NewEventModal";

// Event data interface
interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  registration_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}


const ExistingEvent = ({ event }: ExistingEventProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card key={event.id} className="border-2 border-foreground shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="tracking-tight">{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-3">{formatDate(event.start_at)} — {event.location || 'TBD'}</div>
        <Button className="w-full" onClick={handleViewDetails}>Details</Button>
      </CardContent>
    </Card>
  );
};

interface ExistingEventProps {
  event: EventData;
}



const Events = () => {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('start_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('admin')
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
    fetchEvents(); // Refresh the events list
  };

  // Check if user can create events (admin)
  const canCreateEvents = user && userProfile && userProfile.admin === true;



  // Separate events into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.start_at) >= now);
  const pastEvents = events.filter(event => new Date(event.start_at) < now);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Error Loading Events</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchEvents}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl tracking-tight mb-6">EVENTS</h1>
      </div>

      {/* Upcoming Events Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">UPCOMING EVENTS</h2>
          {canCreateEvents && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setIsAddEventModalOpen(true)}
            >
              + New Event
            </Button>
          )}
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No upcoming events scheduled.</p>
            {canCreateEvents && (
              <Button 
                className="mt-4" 
                onClick={() => setIsAddEventModalOpen(true)}
              >
                Create First Event
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <ExistingEvent key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Past Events Section */}
      {pastEvents.length > 0 && (
        <div className="mb-8">
          <Collapsible open={showPastEvents} onOpenChange={setShowPastEvents}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 p-0 h-auto font-semibold text-lg mb-4"
              >
                {showPastEvents ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5" />
                )}
                PAST RECENT EVENTS ({pastEvents.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <ExistingEvent key={event.id} event={event} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <NewEventModal 
        isOpen={isAddEventModalOpen} 
        onClose={() => setIsAddEventModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default Events;


