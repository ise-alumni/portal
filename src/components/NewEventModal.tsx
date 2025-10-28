import { useState } from "react";
import { Dialog, DialogTitle, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, LinkIcon, ClockIcon, FileTextIcon, EyeIcon, EditIcon, Loader2Icon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const NewEventModal = ({ isOpen, onClose, onEventCreated }: NewEventModalProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateEvent = async () => {
    if (!eventName || !startDate || !startTime) {
      setError("Please fill in all required fields (Event Name, Start Date, Start Time)");
      return;
    }

    if (!user) {
      setError("You must be logged in to create events");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Combine date and time for start_at
      const startDateTime = new Date(startDate);
      const [startHour, startMinute] = startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      // Combine date and time for end_at (if provided)
      let endDateTime = null;
      if (endDate && endTime) {
        endDateTime = new Date(endDate);
        const [endHour, endMinute] = endTime.split(':');
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
      } else if (endTime) {
        // If only end time is provided, use the same date as start
        endDateTime = new Date(startDate);
        const [endHour, endMinute] = endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
      }

      // Get current user's profile to set as organiser
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Parse tags from comma-separated string
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          title: eventName,
          slug: generateSlug(eventName),
          description: description || null,
          location: location || null,
          location_url: link || null,
          registration_url: null, // You can add this field to the form if needed
          start_at: startDateTime.toISOString(),
          end_at: endDateTime?.toISOString() || null,
          organiser_profile_id: profile?.id || null,
          created_by: user.id,
          tags: tagsArray,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Reset form and close modal
      setEventName("");
      setDescription("");
      setLocation("");
      setLink("");
      setStartTime("");
      setEndTime("");
      setTags("");
      setStartDate(undefined);
      setEndDate(undefined);
      setShowPreview(false);
      onEventCreated();
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Event</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details below to add a new event</p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Event Name - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="event-name" className="text-sm font-medium">Event Name *</Label>
            <Input 
              id="event-name"
              placeholder="e.g., Monthly AMA Session" 
              className="w-full"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* To Do: Add Organizer Selection, default to current user */}

          <div data-testid="date-time-section" className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="w-4 h-4" />
              <span>Date & Time</span>
            </div>
            
            <div data-testid="date-time-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div data-testid="start-date" className="space-y-2">
                <Label className="text-sm">Start Date *</Label>
                <div className="border rounded-md p-2">
                  <Calendar 
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div data-testid="end-date" className="space-y-2">
                <Label className="text-sm">End Date</Label>
                <div className="border rounded-md p-2">
                  <Calendar 
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div data-testid="time-grid" className="grid grid-cols-2 gap-4 pl-6">
              <div data-testid="start-time" className="space-y-2">
                <Label htmlFor="start-time" className="text-sm flex items-center gap-2">
                  <ClockIcon className="w-3 h-3" />
                  Start Time *
                </Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              
              <div data-testid="end-time" className="space-y-2">
                <Label htmlFor="end-time" className="text-sm flex items-center gap-2">
                  <ClockIcon className="w-3 h-3" />
                  End Time
                </Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div data-testid="description-section" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                <FileTextIcon className="w-4 h-4" />
                Description (Markdown supported)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? (
                  <>
                    <EditIcon className="w-3 h-3" />
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-3 h-3" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            
            {showPreview ? (
              <div className="min-h-[100px] p-3 border rounded-md bg-muted/50">
                {description ? (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown>{description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description entered yet. Click "Edit" to add content.
                  </p>
                )}
              </div>
            ) : (
              <Textarea
                id="description"
                placeholder="Add event details, agenda, or any additional information... You can use Markdown formatting like **bold**, *italic*, [links](https://example.com), etc."
                className="min-h-[100px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </div>

          {/* Location & Link */}
          <div data-testid="location-link-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                Location
              </Label>
              <Input 
                id="location"
                placeholder="e.g., Dublin, Online, Room 101" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div data-testid="link-section" className="space-y-2">
              <Label htmlFor="link" className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Event Link
              </Label>
              <Input 
                id="link"
                type="url"
                placeholder="https://..." 
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Tags
            </Label>
            <Input 
              id="tags"
              placeholder="e.g., Networking, Online, Career (comma-separated)" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            className="bg-primary text-primary-foreground" 
            onClick={handleCreateEvent}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewEventModal;
