// Export all domain services from a central location

// Event services
export * from './events';

// Announcement services
export * from './announcements';

// Profile services
export * from './profiles';

// Residency services
export * from './residency';

// Reminder services
export * from './reminders';

// Additional reminder utilities
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';

export const getReminderCounts = async (): Promise<{
  events: { [eventId: string]: number };
  announcements: { [announcementId: string]: number };
}> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('target_id, target_type')
      .eq('status', 'pending');

    if (error) throw error;

    const counts = {
      events: {} as { [eventId: string]: number },
      announcements: {} as { [announcementId: string]: number }
    };

    data?.forEach((reminder: any) => {
      if (reminder.target_type === 'event') {
        counts.events[reminder.target_id] = (counts.events[reminder.target_id] || 0) + 1;
      } else if (reminder.target_type === 'announcement') {
        counts.announcements[reminder.target_id] = (counts.announcements[reminder.target_id] || 0) + 1;
      }
    });

    return counts;
  } catch (error) {
    log.error('Error fetching reminder counts:', error);
    return { events: {}, announcements: {} };
  }
};