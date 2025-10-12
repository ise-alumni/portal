import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileTextIcon
} from "lucide-react";

// TODO: Replace with API call
const mockEventDetails: Record<number, any> = {
  1: {
    id: 1,
    name: "Monthly AMA",
    date: "2025-09-30",
    startTime: "18:00",
    endTime: "19:30",
    location: "Online",
    locationUrl: "https://zoom.us/j/123456789",
    description: "Join us for our monthly Ask Me Anything session with industry experts. This is a great opportunity to get insights on career development, technical challenges, and industry trends.",
    organiser: "ISE Alumni Team",
    organiserEmail: "alumni@ise.com",
  },
  2: {
    id: 2,
    name: "Hack Night",
    date: "2025-10-12",
    startTime: "19:00",
    endTime: "23:00",
    location: "NYC Tech Hub",
    locationUrl: "https://maps.google.com/nyc-tech-hub",
    description: "Here is the github link, [here](https://github.com/ise-alumni/hack-night). A collaborative coding night where alumni come together to work on projects, share knowledge, and build something amazing. Bring your laptop and ideas!",
    organiser: "Tech Alumni Group",
    organiserEmail: "tech@ise.com",
  },
  3: {
    id: 3,
    name: "Career Roundtable",
    date: "2025-11-05",
    startTime: "17:00",
    endTime: "19:00",
    location: "Remote",
    locationUrl: "https://meet.google.com/career-roundtable",
    description: "An intimate discussion about career transitions, leadership, and professional growth. Share your experiences and learn from fellow alumni.",
    organiser: "Career Development Committee",
    organiserEmail: "career@ise.com",
  }
};

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
  
  const eventId = id ? parseInt(id) : null;
  const event = eventId ? mockEventDetails[eventId] : null;

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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Events
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground mt-1">Event Details</p>
        </div>
        <Badge variant={getStatus(event.date) === 'upcoming' ? 'default' : 'secondary'}>
          {getStatus(event.date)}
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
                    <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
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
                <ReactMarkdown>{event.description}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle>Event Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg">
                Register for Event
              </Button>
              
              {event.locationUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={event.locationUrl} target="_blank" rel="noopener noreferrer">
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
                <p className="font-medium">{event.organiser}</p>
                <p className="text-sm text-muted-foreground">{event.organiserEmail}</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default EventDetail;
