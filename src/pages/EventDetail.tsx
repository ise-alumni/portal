import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon
} from "lucide-react";

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

// Possible Future Features:
// - Attendees
// - Tags
// - Agenda
// - RSVPs
// - Cancellation
// - Add to Calendar

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError("No event ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch event with organiser profile data
        const { data, error: fetchError } = await supabase
          .from('events')
          .select(`
            *,
            organiser:organiser_profile_id (
              id,
              full_name,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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
        <Badge variant={getStatus(event.start_at) === 'upcoming' ? 'default' : 'secondary'}>
          {getStatus(event.start_at)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Event Information
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
                About This Event
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
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
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
                  {event.organiser?.email || 'No email available'}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default EventDetail;
