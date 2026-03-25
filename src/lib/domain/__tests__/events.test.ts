import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type EventData, type Tag } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';
import {
  getEvents,
  getTags,
  getEventById,
  getEventsByUserId,
  deleteEvent,
  createTag,
  updateTag,
  deleteTag,
  getTagById,
  isEventInPast,
  isEventUpcoming,
  isEventOngoing,
} from '../events';

const createTestEvent = (overrides: Partial<EventData> = {}): EventData => ({
  id: '1',
  title: 'Test Event',
  description: 'Test description',
  start_at: '2024-02-15T10:00:00Z',
  end_at: '2024-02-15T12:00:00Z',
  location: 'Test Location',
  location_url: null,
  registration_url: null,
  organiser_profile_id: null,
  created_by: 'user-1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  image_url: null,
  event_tags: [],
  organiser: undefined,
  ...overrides,
});

const createTestTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 't1',
  name: 'React',
  color: '#61DAFB',
  ...overrides,
});

describe('Events Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        createTestEvent({ title: 'React Workshop' }),
        createTestEvent({ title: 'Networking Event', id: '2' }),
      ];
      vi.mocked(api.get).mockResolvedValue(mockEvents);

      const result = await getEvents();

      expect(api.get).toHaveBeenCalledWith('/api/events');
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      const result = await getEvents();

      expect(log.error).toHaveBeenCalledWith('Error fetching events:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getTags', () => {
    it('should fetch tags successfully', async () => {
      const mockTags = [createTestTag(), createTestTag({ id: 't2', name: 'TypeScript', color: '#3178C6' })];
      vi.mocked(api.get).mockResolvedValue(mockTags);

      const result = await getTags();

      expect(api.get).toHaveBeenCalledWith('/api/tags');
      expect(result).toEqual(mockTags);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getTags();

      expect(log.error).toHaveBeenCalledWith('Error fetching tags:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getEventById', () => {
    it('should fetch event by id successfully', async () => {
      const mockEvent = createTestEvent();
      vi.mocked(api.get).mockResolvedValue(mockEvent);

      const result = await getEventById('1');

      expect(api.get).toHaveBeenCalledWith('/api/events/1');
      expect(result).toEqual(mockEvent);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getEventById('999');

      expect(log.error).toHaveBeenCalledWith('Error fetching event by ID:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('getEventsByUserId', () => {
    it('should fetch events by user id successfully', async () => {
      const mockEvents = [createTestEvent({ created_by: 'user-123' })];
      vi.mocked(api.get).mockResolvedValue(mockEvents);

      const result = await getEventsByUserId('user-123');

      expect(api.get).toHaveBeenCalledWith('/api/events/user/user-123');
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getEventsByUserId('user-123');

      expect(log.error).toHaveBeenCalledWith('Error fetching events by user ID:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const result = await deleteEvent('event-1');

      expect(api.delete).toHaveBeenCalledWith('/api/events/event-1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteEvent('event-1');

      expect(log.error).toHaveBeenCalledWith('Error deleting event:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('createTag', () => {
    it('should create tag successfully', async () => {
      const mockTag = createTestTag({ id: 'new-1', name: 'Vue', color: '#42b883' });
      vi.mocked(api.post).mockResolvedValue(mockTag);

      const result = await createTag('Vue', '#42b883');

      expect(api.post).toHaveBeenCalledWith('/api/tags', { name: 'Vue', color: '#42b883' });
      expect(result).toEqual(mockTag);
    });

    it('should return null on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Creation failed'));

      const result = await createTag('Vue', '#42b883');

      expect(log.error).toHaveBeenCalledWith('Error creating tag:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('updateTag', () => {
    it('should update tag successfully', async () => {
      const mockTag = createTestTag({ name: 'Updated', color: '#000' });
      vi.mocked(api.put).mockResolvedValue(mockTag);

      const result = await updateTag('t1', 'Updated', '#000');

      expect(api.put).toHaveBeenCalledWith('/api/tags/t1', { name: 'Updated', color: '#000' });
      expect(result).toEqual(mockTag);
    });

    it('should return null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Update failed'));

      const result = await updateTag('t1', 'Updated', '#000');

      expect(log.error).toHaveBeenCalledWith('Error updating tag:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const result = await deleteTag('t1');

      expect(api.delete).toHaveBeenCalledWith('/api/tags/t1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteTag('t1');

      expect(log.error).toHaveBeenCalledWith('Error deleting tag:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('getTagById', () => {
    it('should fetch tag by id successfully', async () => {
      const mockTag = createTestTag();
      vi.mocked(api.get).mockResolvedValue(mockTag);

      const result = await getTagById('t1');

      expect(api.get).toHaveBeenCalledWith('/api/tags/t1');
      expect(result).toEqual(mockTag);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getTagById('t1');

      expect(log.error).toHaveBeenCalledWith('Error fetching tag:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('Event Status Helpers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('isEventInPast', () => {
      it('should return true for past events', () => {
        vi.setSystemTime(new Date('2024-01-16T10:00:00Z'));
        const pastEvent = createTestEvent({ start_at: '2024-01-15T10:00:00Z', end_at: '2024-01-15T12:00:00Z' });
        expect(isEventInPast(pastEvent)).toBe(true);
      });

      it('should return false for future events', () => {
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        const futureEvent = createTestEvent({ start_at: '2024-01-20T10:00:00Z', end_at: '2024-01-20T12:00:00Z' });
        expect(isEventInPast(futureEvent)).toBe(false);
      });

      it('should handle events without end time', () => {
        vi.setSystemTime(new Date('2024-01-16T10:00:00Z'));
        const event = createTestEvent({ start_at: '2024-01-15T10:00:00Z', end_at: null });
        expect(isEventInPast(event)).toBe(true);
      });
    });

    describe('isEventUpcoming', () => {
      it('should return true for future events', () => {
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        const futureEvent = createTestEvent({ start_at: '2024-01-20T10:00:00Z' });
        expect(isEventUpcoming(futureEvent)).toBe(true);
      });

      it('should return false for past events', () => {
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        const pastEvent = createTestEvent({ start_at: '2024-01-10T10:00:00Z' });
        expect(isEventUpcoming(pastEvent)).toBe(false);
      });
    });

    describe('isEventOngoing', () => {
      it('should return true for events currently in progress', () => {
        vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
        const event = createTestEvent({ start_at: '2024-01-15T08:00:00Z', end_at: '2024-01-15T14:00:00Z' });
        expect(isEventOngoing(event)).toBe(true);
      });

      it('should return false for events that have not started', () => {
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        const event = createTestEvent({ start_at: '2024-01-15T14:00:00Z', end_at: '2024-01-15T16:00:00Z' });
        expect(isEventOngoing(event)).toBe(false);
      });

      it('should return false for events that have ended', () => {
        vi.setSystemTime(new Date('2024-01-15T18:00:00Z'));
        const event = createTestEvent({ start_at: '2024-01-15T08:00:00Z', end_at: '2024-01-15T10:00:00Z' });
        expect(isEventOngoing(event)).toBe(false);
      });

      it('should handle events without end time', () => {
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        const event = createTestEvent({ start_at: '2024-01-15T08:00:00Z', end_at: null });
        expect(isEventOngoing(event)).toBe(true);
      });
    });
  });
});
