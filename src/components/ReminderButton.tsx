import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BellIcon, BellOffIcon, Loader2Icon } from 'lucide-react';
import { fetchReminderForTarget, createReminder, removeReminder, calculateReminderTime } from '@/lib/domain/reminders';
import { ReminderTargetType } from '@/lib/types/reminders';
import { log } from '@/lib/utils/logger';

interface ReminderButtonProps {
  targetId: string;
  targetType: ReminderTargetType;
  targetDate: string;
  title?: string;
  description?: string;
  location?: string;
  registrationUrl?: string;
}

const ReminderButton = ({
  targetId,
  targetType,
  targetDate,
  title,
  description,
  location,
  registrationUrl
}: ReminderButtonProps) => {
  const { user } = useAuth();
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkReminder = async () => {
      if (!user) return;
      
      const reminder = await fetchReminderForTarget(user.id, targetId, targetType);
      setHasReminder(!!reminder);
    };

    checkReminder();
  }, [user, targetId, targetType]);

  const handleToggleReminder = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (hasReminder) {
        // Delete reminder
        const success = await removeReminder(user.id, targetId, targetType);
        if (success) {
          setHasReminder(false);
        }
      } else {
        // Create reminder
        const reminderAt = calculateReminderTime(targetType, targetDate);
        const reminder = await createReminder(user.id, {
          target_type: targetType,
          target_id: targetId,
          reminder_at: reminderAt,
        });
        
        if (reminder) {
          setHasReminder(true);
        }
      }
    } catch (error) {
      log.error('Error toggling reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={hasReminder ? "secondary" : "outline"}
      className="w-full"
      onClick={handleToggleReminder}
      disabled={loading}
    >
      {loading ? (
        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
      ) : hasReminder ? (
        <BellOffIcon className="w-4 h-4 mr-2" />
      ) : (
        <BellIcon className="w-4 h-4 mr-2" />
      )}
      {hasReminder ? 'Reminder Set' : 'Set Reminder'}
    </Button>
  );
};

export default ReminderButton;