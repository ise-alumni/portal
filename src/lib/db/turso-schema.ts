import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate UUID for SQLite
export function generateId() {
  return uuidv4();
}

// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: text('accessTokenExpiresAt'),
  refreshTokenExpiresAt: text('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expiresAt').notNull(),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// PROFILES TABLE & RELATED
// ============================================================================

export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    user_id: text('user_id').notNull().unique(),
    full_name: text('full_name'),
    email: text('email'),
    city: text('city'),
    country: text('country'),
    graduation_year: integer('graduation_year'),
    job_title: text('job_title'),
    company: text('company'),
    bio: text('bio'),
    avatar_url: text('avatar_url'),
    is_public: integer('is_public', { mode: 'boolean' }).default(true),
    github_url: text('github_url'),
    linkedin_url: text('linkedin_url'),
    twitter_url: text('twitter_url'),
    website_url: text('website_url'),
    is_remote: integer('is_remote', { mode: 'boolean' }).default(false),
    is_entrepreneur: integer('is_entrepreneur', { mode: 'boolean' }).default(false),
    is_ise_champion: integer('is_ise_champion', { mode: 'boolean' }).default(false),
    msc: integer('msc', { mode: 'boolean' }).default(false),
    user_type: text('user_type').default('Alum'),
    professional_status: text('professional_status').default('open_to_work'),
    cohort: integer('cohort'),
    removed: integer('removed', { mode: 'boolean' }).default(false),
    lat: real('lat'),
    lng: real('lng'),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    userIdIdx: index('idx_profiles_user_id').on(table.user_id),
    removedIdx: index('idx_profiles_removed').on(table.removed),
    userTypeIdx: index('idx_profiles_user_type').on(table.user_type),
    isPublicIdx: index('idx_profiles_is_public').on(table.is_public),
    cohortIdx: index('idx_profiles_cohort').on(table.cohort),
  })
);

export const profilesHistory = sqliteTable(
  'profiles_history',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    profile_id: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    job_title: text('job_title'),
    company: text('company'),
    city: text('city'),
    country: text('country'),
    professional_status: text('professional_status'),
    is_remote: integer('is_remote', { mode: 'boolean' }),
    is_ise_champion: integer('is_ise_champion', { mode: 'boolean' }),
    changed_at: text('changed_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    change_type: text('change_type').notNull(),
  },
  (table) => ({
    profileIdIdx: index('idx_profiles_history_profile_id').on(table.profile_id),
    changedAtIdx: index('idx_profiles_history_changed_at').on(table.changed_at),
  })
);

// ============================================================================
// TAGS TABLE
// ============================================================================

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    name: text('name').notNull().unique(),
    color: text('color').default('#3b82f6'),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    nameIdx: index('idx_tags_name').on(table.name),
  })
);

// ============================================================================
// EVENTS TABLE & RELATED
// ============================================================================

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    title: text('title').notNull(),
    slug: text('slug').unique(),
    description: text('description'),
    location: text('location'),
    location_url: text('location_url'),
    registration_url: text('registration_url'),
    start_at: text('start_at').notNull(),
    end_at: text('end_at'),
    organiser_profile_id: text('organiser_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    created_by: text('created_by').notNull(),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    startAtIdx: index('idx_events_start_at').on(table.start_at),
    createdByIdx: index('idx_events_created_by').on(table.created_by),
  })
);

export const eventTags = sqliteTable(
  'event_tags',
  {
    event_id: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    tag_id: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.event_id, table.tag_id] }),
    eventIdIdx: index('idx_event_tags_event_id').on(table.event_id),
    tagIdIdx: index('idx_event_tags_tag_id').on(table.tag_id),
  })
);

// ============================================================================
// ANNOUNCEMENTS TABLE & RELATED
// ============================================================================

export const announcements = sqliteTable(
  'announcements',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    title: text('title').notNull(),
    content: text('content'),
    external_url: text('external_url'),
    deadline: text('deadline'),
    created_by: text('created_by').notNull(),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    createdAtIdx: index('idx_announcements_created_at').on(table.created_at),
    deadlineIdx: index('idx_announcements_deadline').on(table.deadline),
  })
);

export const announcementTags = sqliteTable(
  'announcement_tags',
  {
    announcement_id: text('announcement_id')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    tag_id: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.announcement_id, table.tag_id] }),
    announcementIdIdx: index('idx_announcement_tags_announcement_id').on(table.announcement_id),
    tagIdIdx: index('idx_announcement_tags_tag_id').on(table.tag_id),
  })
);

// ============================================================================
// RESIDENCY TABLES
// ============================================================================

export const residencyPartners = sqliteTable(
  'residency_partners',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    name: text('name').notNull(),
    website: text('website'),
    logo_url: text('logo_url'),
    description: text('description'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    nameIdx: index('idx_residency_partners_name').on(table.name),
    isActiveIdx: index('idx_residency_partners_is_active').on(table.is_active),
  })
);

export const residencies = sqliteTable(
  'residencies',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    phase: text('phase').notNull(),
    company_id: text('company_id')
      .notNull()
      .references(() => residencyPartners.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    description: text('description'),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    userIdIdx: index('idx_residencies_user_id').on(table.user_id),
    companyIdIdx: index('idx_residencies_company_id').on(table.company_id),
    phaseIdx: index('idx_residencies_phase').on(table.phase),
    phaseUserIdx: index('idx_residencies_phase_user').on(table.phase, table.user_id),
    uniquePhaseUser: uniqueIndex('idx_residencies_unique_phase_user').on(table.phase, table.user_id),
  })
);

// ============================================================================
// REMINDERS TABLE
// ============================================================================

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    user_id: text('user_id').notNull(),
    target_type: text('target_type').notNull(),
    target_id: text('target_id').notNull(),
    reminder_at: text('reminder_at').notNull(),
    status: text('status').default('pending'),
    sent_at: text('sent_at'),
    error_message: text('error_message'),
    created_at: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    reminderAtIdx: index('idx_reminders_reminder_at').on(table.reminder_at),
    userTargetIdx: index('idx_reminders_user_target').on(table.user_id, table.target_type, table.target_id),
    statusIdx: index('idx_reminders_status').on(table.status),
    uniqueUserTarget: uniqueIndex('idx_reminders_unique_user_target').on(table.user_id, table.target_type, table.target_id),
  })
);

// ============================================================================
// TYPE EXPORTS FOR TYPE SAFETY
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type ProfileHistory = typeof profilesHistory.$inferSelect;
export type NewProfileHistory = typeof profilesHistory.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type EventTag = typeof eventTags.$inferSelect;
export type NewEventTag = typeof eventTags.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type AnnouncementTag = typeof announcementTags.$inferSelect;
export type NewAnnouncementTag = typeof announcementTags.$inferInsert;

export type ResidencyPartner = typeof residencyPartners.$inferSelect;
export type NewResidencyPartner = typeof residencyPartners.$inferInsert;

export type Residency = typeof residencies.$inferSelect;
export type NewResidency = typeof residencies.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
