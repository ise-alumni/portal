import { describe, it, expect } from 'vitest'
import {
  filterData,
  sortData,
  paginateData,
  filterProfiles,
  sortProfiles,
  filterEvents,
  sortEvents,
  filterAnnouncements,
  sortAnnouncements,
  processData,
  createSearchFilter,
  createTagFilter,
  createDateRangeFilter,
  type FilterOptions,
  type SortOption,
  type PaginationOptions,
  DEFAULT_SORT_OPTIONS,
  DEFAULT_PAGINATION
} from '../data'
import type { Profile } from '@/lib/types/profiles'
import type { EventData } from '@/lib/types/events'
import type { Announcement } from '@/lib/types/announcements'

// Mock data for testing
const mockProfiles: Profile[] = [
  { 
    id: '1', 
    user_id: '1',
    full_name: 'John Doe', 
 
    bio: 'Software engineer and React developer', 
    company: 'Tech Corp', 
    cohort: 2020, 
    user_type: 'Alum',
    email: 'john@example.com',
    email_visible: true,
    avatar_url: null,
    city: null,
    country: null,
    graduation_year: null,
    job_title: null,
    github_url: null,
    linkedin_url: null,
    twitter_url: null,
    website_url: null,
    is_public: true,
    msc: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  { 
    id: '2', 
    user_id: '2',
    full_name: 'Jane Smith', 
    bio: 'Product strategy', 
    company: 'Startup Inc', 
    cohort: 2019, 
    user_type: 'Staff',
    email: 'jane@example.com',
    email_visible: true,
    avatar_url: null,
    city: null,
    country: null,
    graduation_year: null,
    job_title: null,
    github_url: null,
    linkedin_url: null,
    twitter_url: null,
    website_url: null,
    is_public: true,
    msc: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  { 
    id: '3', 
    user_id: '3',
    full_name: 'Bob Johnson', 
    bio: 'UI/UX design', 
    company: 'Design Studio', 
    cohort: 2021, 
    user_type: 'Alum',
    email: 'bob@example.com',
    email_visible: true,
    avatar_url: null,
    city: null,
    country: null,
    graduation_year: null,
    job_title: null,
    github_url: null,
    linkedin_url: null,
    twitter_url: null,
    website_url: null,
    is_public: true,
    msc: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
]

const mockEvents: EventData[] = [
  { 
    id: '1', 
    title: 'React Workshop', 
    slug: 'react-workshop',
    description: 'Learn React basics', 
    location: 'Online',
    location_url: null,
    registration_url: null,
    start_at: '2024-01-15T10:00:00Z',
    end_at: '2024-01-15T12:00:00Z',
    organiser_profile_id: null,
    created_by: '1',
    image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    event_tags: [
      { tag_id: '1', tags: { id: '1', name: 'Workshop', color: '#10b981' } },
      { tag_id: '2', tags: { id: '2', name: 'Technical', color: '#f59e0b' } }
    ]
  },
  { 
    id: '2', 
    title: 'Networking Event', 
    slug: 'networking-event',
    description: 'Meet alumni', 
    location: 'Office',
    location_url: null,
    registration_url: null,
    start_at: '2024-02-20T18:00:00Z',
    end_at: '2024-02-20T20:00:00Z',
    organiser_profile_id: null,
    created_by: '1',
    image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    event_tags: [
      { tag_id: '3', tags: { id: '3', name: 'Networking', color: '#ef4444' } }
    ]
  },
  { 
    id: '3', 
    title: 'Career Fair', 
    slug: 'career-fair',
    description: 'Job opportunities', 
    location: 'Campus',
    location_url: null,
    registration_url: null,
    start_at: '2024-03-10T10:00:00Z',
    end_at: '2024-03-10T16:00:00Z',
    organiser_profile_id: null,
    created_by: '1',
    image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    event_tags: [
      { tag_id: '4', tags: { id: '4', name: 'Career', color: '#8b5cf6' } },
      { tag_id: '3', tags: { id: '3', name: 'Networking', color: '#ef4444' } }
    ]
  },
]

const mockAnnouncements: Announcement[] = [
  { 
    id: '1', 
    title: 'Job Opening', 
    content: 'Software engineer position',
    type: 'opportunity',
    external_url: null,
    deadline: null,
    image_url: null,
    created_at: '2024-01-10',
    updated_at: '2024-01-10',
    created_by: '1',
    slug: 'job-opening'
  },
  { 
    id: '2', 
    title: 'New Course', 
    content: 'Advanced React course',
    type: 'lecture',
    external_url: null,
    deadline: null,
    image_url: null,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
    created_by: '1',
    slug: 'new-course'
  },
  { 
    id: '3', 
    title: 'Alumni Meetup', 
    content: 'Monthly gathering',
    type: 'program',
    external_url: null,
    deadline: null,
    image_url: null,
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
    created_by: '1',
    slug: 'alumni-meetup'
  },
]

describe('filterData', () => {
  it('should filter data by search term', () => {
    const filters: FilterOptions = { search: 'john' }
    const result = filterData(mockProfiles, filters, ['full_name', 'bio', 'company'])
    expect(result).toHaveLength(2) // "john" matches "John Doe" and "Bob Johnson"
    expect(result.map(p => p.full_name)).toContain('John Doe')
    expect(result.map(p => p.full_name)).toContain('Bob Johnson')
  })

  it('should filter data by tags (array of objects)', () => {
    // Convert events to have tags property for filtering
    const eventsWithTags = mockEvents.map(event => ({
      ...event,
      tags: event.event_tags?.map(eventTag => eventTag.tags.name) || []
    }))
    const filters: FilterOptions = { tags: ['Workshop'] }
    const result = filterData(eventsWithTags, filters, ['title', 'description', 'location'])
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('React Workshop')
  })

  it('should filter data by tags (array of strings)', () => {
    const eventsWithStringTags = mockEvents.map(event => ({
      ...event,
      tags: event.event_tags?.map(eventTag => eventTag.tags.name) || []
    }))
    const filters: FilterOptions = { tags: ['Workshop'] }
    const result = filterData(eventsWithStringTags, filters, ['title', 'description', 'location'])
    expect(result).toHaveLength(1)
  })

  it('should filter data by cohort', () => {
    const filters: FilterOptions = { cohort: 2020 }
    const result = filterData(mockProfiles, filters, ['full_name', 'bio', 'company'])
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('John Doe')
  })

  it('should filter data by user type', () => {
    const filters: FilterOptions = { userType: 'Staff' }
    const result = filterData(mockProfiles, filters, ['full_name', 'bio', 'company'])
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('Jane Smith')
  })

  it('should filter data by date range', () => {
    const dateFrom = new Date('2024-01-01')
    const dateTo = new Date('2024-01-31')
    const filters: FilterOptions = { dateFrom, dateTo }
    const result = filterData(mockAnnouncements, filters, ['title', 'content'])
    expect(result).toHaveLength(3) // All announcements in January
  })

  it('should handle multiple filters combined', () => {
    const filters: FilterOptions = { 
      search: 'engineer',
      cohort: 2020,
      userType: 'Alum'
    }
    const result = filterData(mockProfiles, filters, ['full_name', 'bio', 'company'])
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('John Doe')
  })

  it('should return all data when no filters provided', () => {
    const filters: FilterOptions = {}
    const result = filterData(mockProfiles, filters, ['full_name', 'bio', 'company'])
    expect(result).toHaveLength(3)
  })
})

describe('sortData', () => {
  it('should sort data ascending by string field', () => {
    const sortOption: SortOption = { field: 'full_name', direction: 'asc' }
    const result = sortData(mockProfiles, sortOption)
    expect(result[0].full_name).toBe('Bob Johnson')
    expect(result[1].full_name).toBe('Jane Smith')
    expect(result[2].full_name).toBe('John Doe')
  })

  it('should sort data descending by string field', () => {
    const sortOption: SortOption = { field: 'full_name', direction: 'desc' }
    const result = sortData(mockProfiles, sortOption)
    expect(result[0].full_name).toBe('John Doe')
    expect(result[1].full_name).toBe('Jane Smith')
    expect(result[2].full_name).toBe('Bob Johnson')
  })

  it('should handle null/undefined values', () => {
    const dataWithNulls = [
      { id: 1, name: null },
      { id: 2, name: 'Alice' },
      { id: 3, name: undefined },
      { id: 4, name: 'Bob' }
    ]
    const sortOption: SortOption = { field: 'name', direction: 'asc' }
    const result = sortData(dataWithNulls, sortOption)
    
    // Both null and undefined come first, order depends on JavaScript sort stability
    expect([result[0].name, result[1].name]).toContain(null)
    expect([result[0].name, result[1].name]).toContain(undefined)
    expect(result[2].name).toBe('Alice')
    expect(result[3].name).toBe('Bob')
  })

  it('should not mutate original array', () => {
    const originalData = [...mockProfiles]
    const sortOption: SortOption = { field: 'full_name', direction: 'asc' }
    sortData(mockProfiles, sortOption)
    expect(mockProfiles).toEqual(originalData)
  })
})

describe('paginateData', () => {
  it('should paginate data correctly', () => {
    const pagination: PaginationOptions = { page: 1, limit: 2 }
    const result = paginateData(mockProfiles, pagination)
    
    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(2)
    expect(result.totalPages).toBe(2)
    expect(result.hasNext).toBe(true)
    expect(result.hasPrev).toBe(false)
  })

  it('should handle second page correctly', () => {
    const pagination: PaginationOptions = { page: 2, limit: 2 }
    const result = paginateData(mockProfiles, pagination)
    
    expect(result.data).toHaveLength(1)
    expect(result.hasNext).toBe(false)
    expect(result.hasPrev).toBe(true)
  })

  it('should handle empty data', () => {
    const pagination: PaginationOptions = { page: 1, limit: 10 }
    const result = paginateData([], pagination)
    
    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
    expect(result.hasNext).toBe(false)
    expect(result.hasPrev).toBe(false)
  })
})

describe('Profile-specific functions', () => {
  it('should filter profiles using profile-specific function', () => {
    const filters: FilterOptions = { search: 'software' }
    const result = filterProfiles(mockProfiles, filters)
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('John Doe')
  })

  it('should sort profiles using profile-specific function', () => {
    const sortOption: SortOption = { field: 'full_name', direction: 'asc' }
    const result = sortProfiles(mockProfiles, sortOption)
    expect(result[0].full_name).toBe('Bob Johnson')
  })
})

describe('Event-specific functions', () => {
  it('should filter events using event-specific function', () => {
    const filters: FilterOptions = { search: 'react' }
    const result = filterEvents(mockEvents, filters)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('React Workshop')
  })

  it('should sort events using event-specific function', () => {
    const sortOption: SortOption = { field: 'title', direction: 'asc' }
    const result = sortEvents(mockEvents, sortOption)
    expect(result[0].title).toBe('Career Fair')
  })
})

describe('Announcement-specific functions', () => {
  it('should filter announcements using announcement-specific function', () => {
    const filters: FilterOptions = { search: 'job' }
    const result = filterAnnouncements(mockAnnouncements, filters)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Job Opening')
  })

  it('should sort announcements using announcement-specific function', () => {
    const sortOption: SortOption = { field: 'title', direction: 'asc' }
    const result = sortAnnouncements(mockAnnouncements, sortOption)
    expect(result[0].title).toBe('Alumni Meetup')
  })
})

describe('processData (combined function)', () => {
  it('should combine filter, sort, and paginate operations', () => {
    const filters: FilterOptions = { search: 'engineer' }
    const sort: SortOption = { field: 'full_name', direction: 'asc' }
    const pagination: PaginationOptions = { page: 1, limit: 10 }
    
    const result = processData(mockProfiles, filters, sort, pagination, ['full_name', 'bio', 'company'])
    
    expect(result.data).toHaveLength(1)
    expect(result.data[0].full_name).toBe('John Doe')
    expect(result.total).toBe(1)
  })
})

describe('Filter creation utilities', () => {
  it('should create search filter correctly', () => {
    const filter = createSearchFilter('  search term  ')
    expect(filter.search).toBe('search term')
  })

  it('should create empty search filter for empty string', () => {
    const filter = createSearchFilter('   ')
    expect(filter.search).toBeUndefined()
  })

  it('should create tag filter correctly', () => {
    const filter = createTagFilter(['tag1', 'tag2'])
    expect(filter.tags).toEqual(['tag1', 'tag2'])
  })

  it('should create empty tag filter for empty array', () => {
    const filter = createTagFilter([])
    expect(filter.tags).toBeUndefined()
  })

  it('should create date range filter correctly', () => {
    const dateFrom = new Date('2024-01-01')
    const dateTo = new Date('2024-12-31')
    const filter = createDateRangeFilter(dateFrom, dateTo)
    expect(filter.dateFrom).toBe(dateFrom)
    expect(filter.dateTo).toBe(dateTo)
  })
})

describe('Constants', () => {
  it('should have correct default sort options', () => {
    expect(DEFAULT_SORT_OPTIONS.profiles.field).toBe('full_name')
    expect(DEFAULT_SORT_OPTIONS.profiles.direction).toBe('asc')
    expect(DEFAULT_SORT_OPTIONS.events.field).toBe('start_at')
    expect(DEFAULT_SORT_OPTIONS.events.direction).toBe('desc')
    expect(DEFAULT_SORT_OPTIONS.announcements.field).toBe('created_at')
    expect(DEFAULT_SORT_OPTIONS.announcements.direction).toBe('desc')
  })

  it('should have correct default pagination', () => {
    expect(DEFAULT_PAGINATION.page).toBe(1)
    expect(DEFAULT_PAGINATION.limit).toBe(12)
  })
})