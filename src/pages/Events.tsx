import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogTitle, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, MapPinIcon, LinkIcon, ClockIcon, FileTextIcon } from "lucide-react";

// NewEventModal sub-component
interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewEventModal = ({ isOpen, onClose }: NewEventModalProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Event</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details below to add a new event</p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Event Name - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="event-name" className="text-sm font-medium">Event Name *</Label>
            <Input 
              id="event-name"
              placeholder="e.g., Monthly AMA Session" 
              className="w-full"
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
                <Input id="start-time" type="time" />
              </div>
              
              <div data-testid="end-time" className="space-y-2">
                <Label htmlFor="end-time" className="text-sm flex items-center gap-2">
                  <ClockIcon className="w-3 h-3" />
                  End Time
                </Label>
                <Input id="end-time" type="time" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div data-testid="description-section" className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Description
            </Label>
            <Textarea 
              id="description"
              placeholder="Add event details, agenda, or any additional information..."
              className="min-h-[100px] resize-none"
            />
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
                placeholder="e.g., NYC, Online, Room 101" 
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
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-primary text-primary-foreground">
            Create Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// To Do : Move this to a dynamic API call to supabase
const mockEvents = [
  { id: 1, name: "Monthly AMA", date: "2025-09-30", location: "Online" },
  { id: 2, name: "Hack Night", date: "2025-10-12", location: "NYC" },
  { id: 3, name: "Career Roundtable", date: "2025-11-05", location: "Remote" },
];

const Events = () => {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl tracking-tight mb-6">EVENTS</h1>
        {/* To Do: Restrict this UI to admin and Staff only */}
        <Button className="text-white px-4 py-2 rounded-md mb-6" variant="secondary" onClick={() => setIsAddEventModalOpen(true)}>Add Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockEvents.map((e) => (
          <Card key={e.id} className="border-2 border-foreground shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="tracking-tight">{e.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-3">{e.date} — {e.location}</div>
              <Button className="w-full">Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <NewEventModal 
        isOpen={isAddEventModalOpen} 
        onClose={() => setIsAddEventModalOpen(false)} 
      />
    </div>
  );
};

export default Events;


