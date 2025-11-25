import { supabase } from '@/integrations/supabase/client';
import { Reminder, ReminderWithDetails, CreateReminderData, ReminderTargetType } from '@/lib/types/reminders';
import { log } from '@/lib/utils/logger';

export const createReminder = async (userId: string, data: CreateReminderData): Promise<Reminder | null> => {
  try {
    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        target_type: data.target_type,
        target_id: data.target_id,
        reminder_at: data.reminder_at,
      })
      .select()
      .single();

    if (error) throw error;
    return reminder;
  } catch (error) {
    log.error('Error creating reminder:', error);
    return null;
  }
};

export const removeReminder = async (userId: string, targetId: string, targetType: ReminderTargetType): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType);

    if (error) throw error;
    return true;
  } catch (error) {
    log.error('Error deleting reminder:', error);
    return false;
  }
};

export const fetchUserReminders = async (userId: string): Promise<ReminderWithDetails[]> => {
  try {
    // Fetch reminders without joins first
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('reminder_at', { ascending: true });

    if (error) throw error;
    
    if (!reminders || reminders.length === 0) {
      return [];
    }

    // Fetch related data separately
    const eventIds = reminders
      .filter((r: any) => r.target_type === 'event')
      .map((r: any) => r.target_id);
    
    const announcementIds = reminders
      .filter((r: any) => r.target_type === 'announcement')
      .map((r: any) => r.target_id);

    const [eventsData, announcementsData] = await Promise.all([
      eventIds.length > 0 
        ? supabase
            .from('events')
            .select('id, title, start_at, location')
            .in('id', eventIds)
        : Promise.resolve({ data: [], error: null }),
      announcementIds.length > 0
        ? supabase
            .from('announcements')
            .select('id, title, deadline')
            .in('id', announcementIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (eventsData.error) throw eventsData.error;
    if (announcementsData.error) throw announcementsData.error;

    // Combine the data
    return reminders.map((reminder: any) => ({
      ...reminder,
      event: reminder.target_type === 'event' 
        ? eventsData.data?.find((e: any) => e.id === reminder.target_id)
        : undefined,
      announcement: reminder.target_type === 'announcement'
        ? announcementsData.data?.find((a: any) => a.id === reminder.target_id)
        : undefined,
    }));
  } catch (error) {
    log.error('Error fetching user reminders:', error);
    return [];
  }
};

export const fetchReminderForTarget = async (
  userId: string, 
  targetId: string, 
  targetType: ReminderTargetType
): Promise<Reminder | null> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    return data;
  } catch (error) {
    log.error('Error fetching reminder for target:', error);
    return null;
  }
};

export const calculateReminderTime = (_targetType: ReminderTargetType, targetDate: string): string => {
  const date = new Date(targetDate);
  // Remind 1 day before event/deadline
  date.setDate(date.getDate() - 1);
  date.setHours(9, 0, 0, 0); // Set to 9 AM
  return date.toISOString();
};

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

    data?.forEach(reminder => {
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