import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  EditIcon,
  Trash2Icon
} from "lucide-react";
import EditEventModal from "@/components/EditEventModal";
import ReminderButton from "@/components/ReminderButton";
import { log } from '@/lib/utils/logger';
import { SupabaseClient } from '@/integrations/supabase/types';

// Temporary interface for Supabase response
interface SupabaseEvent {
  id: string;
  title: string;
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
  image_url: string | null;
  event_tags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
    email_visible: boolean | null;
  };
}

// Event data interface
interface EventData {
  id: string;
  title: string;
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
  image_url: string | null;
  tags: Array<{ id: string; name: string; color: string }> | null;
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
    email_visible: boolean | null;
  };
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) {
      setError("No event ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch event with organiser profile data and tags
      const { data, error: fetchError } = await (supabase as SupabaseClient)
        .from('events')
        .select(`
          *,
          organiser:organiser_profile_id (
            id,
            full_name,
            email,
            email_visible
          ),
          event_tags (
            tag:tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('Event not found');
      }

      // Transform the data to match our interface
      const transformedData: EventData = {
        id: (data as SupabaseEvent).id,
        title: (data as SupabaseEvent).title,
        description: (data as SupabaseEvent).description,
        location: (data as SupabaseEvent).location,
        location_url: (data as SupabaseEvent).location_url,
        registration_url: (data as SupabaseEvent).registration_url,
        start_at: (data as SupabaseEvent).start_at,
        end_at: (data as SupabaseEvent).end_at,
        organiser_profile_id: (data as SupabaseEvent).organiser_profile_id,
        created_by: (data as SupabaseEvent).created_by,
        created_at: (data as SupabaseEvent).created_at,
        updated_at: (data as SupabaseEvent).updated_at,
        image_url: (data as SupabaseEvent).image_url || null,
        tags: (data as SupabaseEvent).event_tags?.map((et: { tag: { id: string; name: string; color: string } }) => et.tag) || null,
        organiser: (data as SupabaseEvent).organiser,
      };

      setEvent(transformedData);
    } catch (err) {
      log.error('Error fetching event:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [id, fetchEvent]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Error Loading Event</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate('/events')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/events')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  const getStatus = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date > today ? 'upcoming' : 'past';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const imageUrl = event.image_url || `https://placehold.co/600x400?text=Event+${event.id}`;

  // Check if current user can edit this event (organiser only)
  const canEdit = user && (event.organiser_profile_id === user.id);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) throw deleteError;

      navigate('/events');
    } catch (err) {
      log.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEventUpdated = () => {
    fetchEvent();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Events
        </Button>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground mt-1">Event Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatus(event.start_at) === 'upcoming' ? 'default' : 'secondary'}>
            {getStatus(event.start_at)}
          </Badge>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <EditIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting}>
                <Trash2Icon className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          <Card className="border-2 border-foreground shadow-none overflow-hidden">
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
          </Card>

          {/* Event Info Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(event.start_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.start_at)}
                      {event.end_at && ` - ${formatTime(event.end_at)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location || 'TBD'}</p>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{event.description || 'No description available.'}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Tags Section */}
          {event.tags && event.tags.length > 0 && (
            <Card className="border-2 border-foreground shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {event.tags?.map((tag, index) => (
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
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle>Event Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {event.registration_url && (
                <Button className="w-full" size="lg" asChild>
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                    Register for Event
                  </a>
                </Button>
              )}
              
              <ReminderButton
                targetId={event.id}
                targetType="event"
                targetDate={event.start_at}
                title={event.title}
                description={event.description}
                location={event.location}
                registrationUrl={event.registration_url}
              />
              
              {event.location_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={event.location_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    View Location
                  </a>
                </Button>
              )}
              
            </CardContent>
          </Card>

          {/* Organiser Info */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle>Organiser</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {event.organiser?.full_name || 'Unknown Organiser'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.organiser?.email_visible && event.organiser?.email ? event.organiser.email : 'Email hidden'}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEventUpdated}
          event={event}
        />
      )}
    </div>
  );
};

export default EventDetail;
