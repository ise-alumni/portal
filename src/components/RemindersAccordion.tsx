import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, BellIcon, ExternalLinkIcon, Trash2Icon, ClockIcon, MapPinIcon } from 'lucide-react';
import { fetchUserReminders, removeReminder } from '@/lib/domain/reminders';
import { ReminderWithDetails } from '@/lib/types/reminders';
import { log } from '@/lib/utils/logger';

const RemindersAccordion = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReminders = async () => {
      if (!user) return;
      
      try {
        const userReminders = await fetchUserReminders(user.id);
        setReminders(userReminders);
      } catch (error) {
        log.error('Error loading reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, [user]);

  const handleDeleteReminder = async (reminderId: string, targetId: string, targetType: 'event' | 'announcement') => {
    if (!user) return;
    
    try {
      const success = await removeReminder(user.id, targetId, targetType);
      if (success) {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
      }
    } catch (error) {
      log.error('Error deleting reminder:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTargetUrl = (reminder: ReminderWithDetails) => {
    if (reminder.target_type === 'event') {
      return `/events/${reminder.target_id}`;
    } else {
      return `/announcements/${reminder.target_id}`;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-foreground shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BellIcon className="w-5 h-5" />
          Active Reminders
          {reminders.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {reminders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No active reminders. Set reminders for events and announcements to get notified!
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {reminders.map((reminder) => (
              <AccordionItem key={reminder.id} value={reminder.id}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={reminder.target_type === 'event' ? 'default' : 'secondary'}>
                        {reminder.target_type === 'event' ? 'Event' : 'Announcement'}
                      </Badge>
                      <span className="font-medium">
                        {reminder.event?.title || reminder.announcement?.title}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(reminder.reminder_at)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="text-sm">
                      <div className="font-medium mb-2">Reminder Details:</div>
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Reminder: {formatDate(reminder.reminder_at)}</span>
                        </div>
                        {reminder.event && (
                          <>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4" />
                              <span>Event: {formatDate(reminder.event.start_at)}</span>
                            </div>
                            {reminder.event.location && (
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4" />
                                <span>Location: {reminder.event.location}</span>
                              </div>
                            )}
                          </>
                        )}
                        {reminder.announcement && reminder.announcement.deadline && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>Deadline: {formatDate(reminder.announcement.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                      >
                        <a href={getTargetUrl(reminder)}>
                          <ExternalLinkIcon className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteReminder(reminder.id, reminder.target_id, reminder.target_type)}
                      >
                        <Trash2Icon className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default RemindersAccordion;