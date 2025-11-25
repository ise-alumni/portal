// Reminder types for the application

export type ReminderTargetType = 'event' | 'announcement';

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Reminder {
  id: string;
  user_id: string;
  target_type: ReminderTargetType;
  target_id: string;
  reminder_at: string;
  status: ReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderWithDetails extends Reminder {
  // For events
  event?: {
    id: string;
    title: string;
    start_at: string;
    location: string | null;
  };
  // For announcements
  announcement?: {
    id: string;
    title: string;
    deadline: string | null;
  };
}

export interface CreateReminderData {
  target_type: ReminderTargetType;
  target_id: string;
  reminder_at: string;
}

export interface ReminderFormData {
  target_type: ReminderTargetType;
  target_id: string;
  reminder_at: string;
}