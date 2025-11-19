/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
import { getEventTagsSync, isValidEventTag, getEventTagOptions } from '@/lib/constants';

interface EventData {
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  created_by: string;
  image_url: string | null;
}

interface AnnouncementData {
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_by: string;
  tag_ids: string[];
}

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventData | AnnouncementData) => void;
  mode: 'event' | 'announcement';
}

const NewEventModal = ({ isOpen, onClose, onSubmit, mode }: NewEventModalProps) => {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deadline, setDeadline] = useState<string>("");
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const { user } = useAuth();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreate = async () => {
    if (mode === 'event') {
      if (!eventName || !date?.from || !startTime) {
        setError("Please fill in all required fields (Event Name, Start Date, Start Time)");
        return;
      }
    } else {
      if (!eventName) {
        setError("Please fill in announcement title");
        return;
      }
    }

    if (!user) {
      setError("You must be logged in to create content");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      let data: EventData | AnnouncementData;

      if (mode === 'event') {
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

        // Get current user's profile to set as organiser
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

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

        // Create event without tags first
        const eventData = {
          title: eventName,
          slug: generateSlug(eventName),
          description: description || null,
          location: location || null,
          location_url: link || null,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime?.toISOString() || null,
          organiser_profile_id: (profile as { id: string })?.id || null,
          created_by: user.id,
          image_url: imageUrl || null,
        };

        const { data: createdEvent, error: insertError } = await (supabase as any)
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Now insert tag relationships into event_tags junction table
        if (tagIds.length > 0 && createdEvent?.id) {
          const eventTagRelations = tagIds.map(tagId => ({
            event_id: createdEvent.id,
            tag_id: tagId
          }));

          const { error: tagInsertError } = await (supabase as any)
            .from('event_tags')
            .insert(eventTagRelations);

          if (tagInsertError) {
            throw tagInsertError;
          }
        }

        data = eventData;
      } else {
        // Announcement mode
        data = {
          title: eventName,
          content: description || null,
          external_url: externalUrl || null,
          deadline: deadline || null,
          image_url: imageUrl || null,
          created_by: user.id,
          tag_ids: selectedTags,
        };

        const { error: insertError } = await (supabase as any)
          .from('announcements')
          .insert(data)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
      }

      // Reset form and close modal
      setEventName("");
      setDescription("");
      setLocation("");
      setLink("");
      setStartTime("");
      setEndTime("");
      setSelectedTags([]);
      setDate(undefined);
      setShowPreview(false);
      setDeadline("");
      setExternalUrl("");
      setImageUrl("");
      
       onSubmit(data);
      onClose();
    } catch (err) {
      log.error(`Error creating ${mode}:`, err);
      setError(err instanceof Error ? err.message : `Failed to create ${mode}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Create New {mode === 'event' ? 'Event' : 'Announcement'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new {mode === 'event' ? 'event' : 'announcement'}
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
              disabled={isCreating}
            />
          </div>

          {/* Tag Selection - Only show for announcements */}
          {mode === 'announcement' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {getEventTagOptions().map(tagOption => (
                  <label key={tagOption.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={tagOption.value}
                      checked={selectedTags.includes(tagOption.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tagOption.value]);
                        } else {
                          setSelectedTags(selectedTags.filter(t => t !== tagOption.value));
                        }
                      }}
                      disabled={isCreating}
                      className="rounded"
                    />
                    <span className="text-sm">{tagOption.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deadline - Only show for announcements */}
          {mode === 'announcement' && (
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isCreating}
              />
            </div>
          )}

          {/* External URL - Only show for announcements */}
          {mode === 'announcement' && (
          <div className="space-y-2">
          <Label htmlFor="external-url" className="text-sm font-medium">External URL (Optional)</Label>
          <Input
          id="external-url"
          type="url"
          placeholder="https://example.com/more-info"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          disabled={isCreating}
          />
          </div>
          )}

           {/* Image URL - Show for both events and announcements */}
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
               disabled={isCreating}
             />
             <p className="text-xs text-muted-foreground">
               Leave empty to use a random placeholder image
             </p>
           </div>

          {/* Date, Time & Location - Only show for events */}
          {mode === 'event' && (
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
            </div>
          </div>
          )}

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

          {/* Tags Section - Only show for events */}
          {mode === 'event' && (
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
                        disabled={isCreating}
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
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${mode === 'event' ? 'Event' : 'Announcement'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewEventModal;
