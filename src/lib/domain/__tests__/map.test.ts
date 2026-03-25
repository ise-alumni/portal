import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  getMapDataCurrent,
  getMapDataOvertime,
  type CurrentMapDataRow,
  type OvertimeMapDataRow,
} from '../map';

describe('Map Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMapDataCurrent', () => {
    it('should fetch current map data successfully', async () => {
      const mockData: CurrentMapDataRow[] = [
        {
          profile_id: 'p1',
          full_name: 'John Doe',
          avatar_url: null,
          company: 'Tech Corp',
          lat: 53.3498,
          lng: -6.2603,
          graduation_year: 2020,
          cohort: 1,
          msc: false,
          city: 'Dublin',
          country: 'Ireland',
        },
      ];
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await getMapDataCurrent();

      expect(api.get).toHaveBeenCalledWith('/api/map/current');
      expect(result).toEqual(mockData);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getMapDataCurrent();

      expect(log.error).toHaveBeenCalledWith('Error fetching current map data:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getMapDataOvertime', () => {
    it('should fetch overtime map data successfully', async () => {
      const mockData: OvertimeMapDataRow[] = [
        {
          profile_id: 'p1',
          full_name: 'John Doe',
          timestamps: ['2024-01-01'],
          cities: ['Dublin'],
          countries: ['Ireland'],
          companies: ['Tech Corp'],
          job_titles: ['Engineer'],
          lats: [53.3498],
          lngs: [-6.2603],
        },
      ];
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await getMapDataOvertime();

      expect(api.get).toHaveBeenCalledWith('/api/map/overtime');
      expect(result).toEqual(mockData);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getMapDataOvertime();

      expect(log.error).toHaveBeenCalledWith('Error fetching overtime map data:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });
});
