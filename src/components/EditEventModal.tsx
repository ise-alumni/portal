import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, LinkIcon, ClockIcon, FileTextIcon, EyeIcon, EditIcon, Loader2Icon, ImageIcon, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { log } from '@/lib/utils/logger';
import { getEventTagsSync, getEventTagOptions } from '@/lib/constants';

// Temporary type to bypass Supabase complex typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  tags?: Array<{ id: string; name: string }>;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string | null;
    location: string | null;
    location_url: string | null;
    start_at: string;
    end_at: string | null;
    image_url: string | null;
    tags: string[];
  }) => void;
  onDelete?: () => void;
  event: Event | null;
}

const EditEventModal = ({ isOpen, onClose, onSubmit, onDelete, event }: EditEventModalProps) => {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const { user } = useAuth();

  // Initialize form with event data when modal opens
  useEffect(() => {
    if (event && isOpen) {
      setEventName(event.title);
      setDescription(event.description || "");
      setLocation(event.location || "");
      setLink(event.location_url || "");
      setImageUrl(event.image_url || "");
      
      // Set date range
      const startDate = new Date(event.start_at);
      const endDate = event.end_at ? new Date(event.end_at) : null;
      setDate({
        from: startDate,
        to: endDate
      });
      
      // Set times
      setStartTime(format(startDate, 'HH:mm'));
      if (endDate) {
        setEndTime(format(endDate, 'HH:mm'));
      }
      
      // Set tags
      if (event.tags && event.tags.length > 0) {
        setSelectedTags(event.tags.map(tag => tag.name));
      }
    }
  }, [event, isOpen]);



  const handleUpdate = async () => {
    if (!event) return;

    if (!eventName || !date?.from || !startTime) {
      setError("Please fill in all required fields (Event Name, Start Date, Start Time)");
      return;
    }

    if (!user) {
      setError("You must be logged in to update content");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Combine date and time for start_at
      const startDateTime = new Date(date.from);
      const [startHour, startMinute] = startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      // Combine date and time for end_at (if provided)
      let endDateTime = null;
      const endDate = date.to || date.from;
      if (endDate && endTime) {
        endDateTime = new Date(endDate);
        const [endHour, endMinute] = endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
      } else if (endTime) {
        // If only end time is provided, use same date as start
        endDateTime = new Date(date.from);
        const [endHour, endMinute] = endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
      }

      // Convert selected tag names to UUIDs
      const tagIds: string[] = [];
      
      for (const tagName of selectedTags) {
        // Find existing tag
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        if (existingTag && (existingTag as { id: string }).id) {
          tagIds.push((existingTag as { id: string }).id);
        } else {
          log.error('Tag not found in database:', tagName);
        }
      }

      const eventData = {
        title: eventName,
        description: description || null,
        location: location || null,
        location_url: link || null,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime?.toISOString() || null,
        image_url: imageUrl || null,
      };

      // Update event without tags first
      const { error: updateError } = await (supabase as SupabaseAny)
        .from('events')
        .update(eventData)
        .eq('id', event.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update tag relationships: delete existing and insert new ones
      if (tagIds.length > 0) {
        // Delete existing tag relationships
        const { error: deleteError } = await (supabase as SupabaseAny)
          .from('event_tags')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) {
          throw deleteError;
        }

        // Insert new tag relationships
        const eventTagRelations = tagIds.map(tagId => ({
          event_id: event.id,
          tag_id: tagId
        }));

        const { error: tagInsertError } = await (supabase as SupabaseAny)
          .from('event_tags')
          .insert(eventTagRelations);

        if (tagInsertError) {
          throw tagInsertError;
        }
      }
      
      onSubmit({ ...eventData, tags: tagIds });
      onClose();
    } catch (err) {
      log.error("Error updating event:", err);
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;

    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) {
        throw deleteError;
      }
      
      onDelete();
      onClose();
    } catch (err) {
      log.error("Error deleting event:", err);
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Update the event details below
          </DialogDescription>
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
              disabled={isUpdating || isDeleting}
            />
          </div>

           {/* Image URL */}
           <div className="space-y-2">
             <Label htmlFor="image-url" className="text-sm font-medium flex items-center gap-2">
               <ImageIcon className="w-4 h-4" />
               Image URL (Optional)
             </Label>
             <Input
               id="image-url"
               type="url"
               placeholder="https://example.com/image.jpg"
               value={imageUrl}
               onChange={(e) => setImageUrl(e.target.value)}
               disabled={isUpdating || isDeleting}
             />
             <p className="text-xs text-muted-foreground">
               Leave empty to use a random placeholder image
             </p>
           </div>

          {/* Date, Time & Location */}
          <div data-testid="date-time-section" className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="w-4 h-4" />
              <span>Date, Time & Location</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-md p-2">
                <Calendar
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground pt-2 pl-1">
                  Selected: {date?.from ? format(date.from, 'PPP') : 'No start date'}
                  {date?.to ? ` - ${format(date.to, 'PPP')}` : ''}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isUpdating || isDeleting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isUpdating || isDeleting}
                  />
                </div>

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
                    disabled={isUpdating || isDeleting}
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
                    disabled={isUpdating || isDeleting}
                  />
                </div>

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
                disabled={isUpdating || isDeleting}
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
                disabled={isUpdating || isDeleting}
              />
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Tags
            </Label>
            <div className="space-y-2">
              {/* Available tags */}
              <div className="flex flex-wrap gap-2">
                {getEventTagOptions().map((tag) => {
                  const isSelected = selectedTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag.value));
                        } else {
                          setSelectedTags([...selectedTags, tag.value]);
                        }
                      }}
                      disabled={isUpdating || isDeleting}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: isSelected ? tag.color : undefined,
                      }}
                    >
                      {tag.label}
                      {isSelected && (
                        <X className="w-3 h-3 ml-1 inline" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select tags to categorize this event
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isUpdating || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Event"
                )}
              </Button>
            )}
          </div>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={handleUpdate}
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Event"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;