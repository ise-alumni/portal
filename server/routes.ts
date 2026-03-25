import { Hono } from 'hono';
import { eq, and, or, like, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import {
  profiles,
  profilesHistory,
  tags,
  events,
  eventTags,
  announcements,
  announcementTags,
  residencyPartners,
  residencies,
  reminders,
} from '../src/lib/db/turso-schema';

const now = () => new Date().toISOString();

export const api = new Hono();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function enrichEventsWithTags<T extends { id: string }>(eventsList: T[]) {
  return Promise.all(
    eventsList.map(async (event) => {
      const tagsList = await db
        .select({ tag: tags })
        .from(eventTags)
        .innerJoin(tags, eq(eventTags.tag_id, tags.id))
        .where(eq(eventTags.event_id, event.id));
      return { ...event, tags: tagsList.map((t) => t.tag) };
    }),
  );
}

async function enrichAnnouncementsWithTags<T extends { id: string }>(list: T[]) {
  return Promise.all(
    list.map(async (ann) => {
      const tagsList = await db
        .select({ tag: tags })
        .from(announcementTags)
        .innerJoin(tags, eq(announcementTags.tag_id, tags.id))
        .where(eq(announcementTags.announcement_id, ann.id));
      return { ...ann, tags: tagsList.map((t) => t.tag) };
    }),
  );
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

const profileRoutes = new Hono();

profileRoutes.get('/search', async (c) => {
  const q = c.req.query('q') ?? '';
  const pattern = `%${q}%`;
  const rows = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.removed, false),
        or(
          like(profiles.full_name, pattern),
          like(profiles.bio, pattern),
          like(profiles.company, pattern),
        ),
      ),
    )
    .orderBy(asc(profiles.full_name));
  return c.json(rows);
});

profileRoutes.get('/alumni', async (c) => {
  const rows = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.is_public, true),
        eq(profiles.removed, false),
        inArray(profiles.user_type, ['Alum', 'Admin']),
      ),
    )
    .orderBy(asc(profiles.full_name));
  return c.json(rows);
});

profileRoutes.get('/history', async (c) => {
  const rows = await db
    .select()
    .from(profilesHistory)
    .orderBy(asc(profilesHistory.changed_at));
  return c.json(rows);
});

profileRoutes.get('/history/:profileId', async (c) => {
  const { profileId } = c.req.param();
  const rows = await db
    .select()
    .from(profilesHistory)
    .where(eq(profilesHistory.profile_id, profileId))
    .orderBy(asc(profilesHistory.changed_at));
  return c.json(rows);
});

profileRoutes.get('/user/:userId', async (c) => {
  const { userId } = c.req.param();
  const row = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.user_id, userId), eq(profiles.removed, false)))
    .limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json(row[0]);
});

profileRoutes.get('/type/:userId', async (c) => {
  const { userId } = c.req.param();
  const row = await db
    .select({ user_type: profiles.user_type })
    .from(profiles)
    .where(eq(profiles.user_id, userId))
    .limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json(row[0]);
});

profileRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const row = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.removed, false)))
    .limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json(row[0]);
});

profileRoutes.get('/', async (c) => {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.removed, false))
    .orderBy(asc(profiles.full_name));
  return c.json(rows);
});

profileRoutes.put('/:userId', async (c) => {
  const { userId } = c.req.param();
  const body = await c.req.json();

  const fieldMap: Record<string, keyof typeof profiles.$inferInsert> = {
    fullName: 'full_name',
    city: 'city',
    country: 'country',
    graduationYear: 'graduation_year',
    msc: 'msc',
    jobTitle: 'job_title',
    company: 'company',
    bio: 'bio',
    githubUrl: 'github_url',
    linkedinUrl: 'linkedin_url',
    twitterUrl: 'twitter_url',
    websiteUrl: 'website_url',
    avatarUrl: 'avatar_url',
    isRemote: 'is_remote',
    isEntrepreneur: 'is_entrepreneur',
    isIseChampion: 'is_ise_champion',
    professionalStatus: 'professional_status',
  };

  const update: Record<string, unknown> = { updated_at: now() };
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) {
      update[snake] = body[camel];
    }
  }

  const result = await db
    .update(profiles)
    .set(update)
    .where(eq(profiles.user_id, userId))
    .returning();

  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json(result[0]);
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const eventRoutes = new Hono();

eventRoutes.get('/user/:userId', async (c) => {
  const { userId } = c.req.param();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.created_by, userId))
    .orderBy(desc(events.start_at));
  return c.json(await enrichEventsWithTags(rows));
});

eventRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const row = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  const enriched = await enrichEventsWithTags(row);
  return c.json(enriched[0]);
});

eventRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await db.delete(eventTags).where(eq(eventTags.event_id, id));
  const result = await db.delete(events).where(eq(events.id, id)).returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

eventRoutes.get('/', async (c) => {
  const rows = await db.select().from(events).orderBy(asc(events.start_at));
  return c.json(await enrichEventsWithTags(rows));
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

const tagRoutes = new Hono();

tagRoutes.get('/', async (c) => {
  const rows = await db.select().from(tags).orderBy(asc(tags.name));
  return c.json(rows);
});

tagRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const row = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json(row[0]);
});

tagRoutes.post('/', async (c) => {
  const { name, color } = await c.req.json();
  const result = await db.insert(tags).values({ name, color }).returning();
  return c.json(result[0], 201);
});

tagRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const { name, color } = await c.req.json();
  const update: Record<string, unknown> = { updated_at: now() };
  if (name !== undefined) update.name = name;
  if (color !== undefined) update.color = color;
  const result = await db.update(tags).set(update).where(eq(tags.id, id)).returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json(result[0]);
});

tagRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await db.delete(eventTags).where(eq(eventTags.tag_id, id));
  await db.delete(announcementTags).where(eq(announcementTags.tag_id, id));
  const result = await db.delete(tags).where(eq(tags.id, id)).returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

const announcementRoutes = new Hono();

announcementRoutes.get('/user/:userId', async (c) => {
  const { userId } = c.req.param();
  const rows = await db
    .select()
    .from(announcements)
    .where(eq(announcements.created_by, userId))
    .orderBy(desc(announcements.created_at));
  return c.json(await enrichAnnouncementsWithTags(rows));
});

announcementRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const row = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  const enriched = await enrichAnnouncementsWithTags(row);
  return c.json(enriched[0]);
});

announcementRoutes.post('/:id/tags', async (c) => {
  const { id } = c.req.param();
  const { tag_id } = await c.req.json();
  const result = await db
    .insert(announcementTags)
    .values({ announcement_id: id, tag_id })
    .returning();
  return c.json(result[0], 201);
});

announcementRoutes.delete('/:announcementId/tags/:tagId', async (c) => {
  const { announcementId, tagId } = c.req.param();
  await db
    .delete(announcementTags)
    .where(
      and(
        eq(announcementTags.announcement_id, announcementId),
        eq(announcementTags.tag_id, tagId),
      ),
    );
  return c.json({ success: true });
});

announcementRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await db.delete(announcementTags).where(eq(announcementTags.announcement_id, id));
  const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

announcementRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const update: Record<string, unknown> = { updated_at: now() };
  if (body.title !== undefined) update.title = body.title;
  if (body.content !== undefined) update.content = body.content;
  if (body.external_url !== undefined) update.external_url = body.external_url;
  if (body.deadline !== undefined) update.deadline = body.deadline;
  const result = await db
    .update(announcements)
    .set(update)
    .where(eq(announcements.id, id))
    .returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json(result[0]);
});

announcementRoutes.post('/', async (c) => {
  const { title, content, external_url, deadline, created_by } = await c.req.json();
  const result = await db
    .insert(announcements)
    .values({ title, content, external_url, deadline, created_by })
    .returning();
  return c.json(result[0], 201);
});

announcementRoutes.get('/', async (c) => {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.created_at));
  return c.json(await enrichAnnouncementsWithTags(rows));
});

// ---------------------------------------------------------------------------
// Residencies
// ---------------------------------------------------------------------------

const residencyRoutes = new Hono();

residencyRoutes.get('/user/:userId', async (c) => {
  const { userId } = c.req.param();
  const rows = await db
    .select({
      residency: residencies,
      partner: residencyPartners,
    })
    .from(residencies)
    .innerJoin(residencyPartners, eq(residencies.company_id, residencyPartners.id))
    .where(eq(residencies.user_id, userId));
  return c.json(rows.map((r) => ({ ...r.residency, partner: r.partner })));
});

const residencyPartnerRoutes = new Hono();

residencyPartnerRoutes.get('/', async (c) => {
  const rows = await db
    .select()
    .from(residencyPartners)
    .where(eq(residencyPartners.is_active, true))
    .orderBy(asc(residencyPartners.name));
  return c.json(rows);
});

residencyPartnerRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const row = await db
    .select()
    .from(residencyPartners)
    .where(eq(residencyPartners.id, id))
    .limit(1);
  if (!row.length) return c.json({ error: 'Not found' }, 404);
  return c.json(row[0]);
});

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

const reminderRoutes = new Hono();

reminderRoutes.get('/user/:userId', async (c) => {
  const { userId } = c.req.param();
  const rows = await db
    .select()
    .from(reminders)
    .where(eq(reminders.user_id, userId))
    .orderBy(asc(reminders.reminder_at));
  return c.json(rows);
});

reminderRoutes.get('/pending', async (c) => {
  const rows = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.status, 'pending'),
        sql`${reminders.reminder_at} <= ${now()}`,
      ),
    )
    .orderBy(asc(reminders.reminder_at));
  return c.json(rows);
});

reminderRoutes.post('/', async (c) => {
  const { user_id, target_type, target_id, reminder_at } = await c.req.json();
  const result = await db
    .insert(reminders)
    .values({ user_id, target_type, target_id, reminder_at })
    .returning();
  return c.json(result[0], 201);
});

reminderRoutes.put('/:id/status', async (c) => {
  const { id } = c.req.param();
  const { status, error_message } = await c.req.json();
  const update: Record<string, unknown> = { status, updated_at: now() };
  if (error_message !== undefined) update.error_message = error_message;
  if (status === 'sent') update.sent_at = now();
  const result = await db
    .update(reminders)
    .set(update)
    .where(eq(reminders.id, id))
    .returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json(result[0]);
});

reminderRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const result = await db.delete(reminders).where(eq(reminders.id, id)).returning();
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Map data
// ---------------------------------------------------------------------------

const mapRoutes = new Hono();

mapRoutes.get('/current', async (c) => {
  const rows = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.is_public, true),
        eq(profiles.removed, false),
        inArray(profiles.user_type, ['Alum', 'Admin']),
        sql`${profiles.lat} IS NOT NULL`,
        sql`${profiles.lng} IS NOT NULL`,
      ),
    );
  return c.json(rows);
});

mapRoutes.get('/overtime', async (c) => {
  const rows = await db
    .select({
      history: profilesHistory,
      profile: profiles,
    })
    .from(profilesHistory)
    .innerJoin(profiles, eq(profilesHistory.profile_id, profiles.id))
    .orderBy(asc(profilesHistory.changed_at));
  return c.json(rows.map((r) => ({ ...r.history, profile: r.profile })));
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const constantRoutes = new Hono();

constantRoutes.get('/user-types', async (c) => {
  const rows = await db
    .selectDistinct({ user_type: profiles.user_type })
    .from(profiles);
  return c.json(rows.map((r) => r.user_type));
});

constantRoutes.get('/event-tags', async (c) => {
  const rows = await db
    .select({ name: tags.name, color: tags.color })
    .from(tags)
    .orderBy(asc(tags.name));
  return c.json(rows);
});

// ---------------------------------------------------------------------------
// Mount all route groups
// ---------------------------------------------------------------------------

api.route('/api/profiles', profileRoutes);
api.route('/api/events', eventRoutes);
api.route('/api/tags', tagRoutes);
api.route('/api/announcements', announcementRoutes);
api.route('/api/residencies', residencyRoutes);
api.route('/api/residency-partners', residencyPartnerRoutes);
api.route('/api/reminders', reminderRoutes);
api.route('/api/map', mapRoutes);
api.route('/api/constants', constantRoutes);
