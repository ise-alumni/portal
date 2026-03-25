import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { app } from '../app';
import { db } from '../db';
import { client } from '../db';
import { SCHEMA_SQL } from '../schema.sql';
import {
  profiles,
  tags,
  events,
  eventTags,
  announcements,
  announcementTags,
  residencyPartners,
  residencies,
  reminders,
  profilesHistory,
  user,
  session,
  account,
  verification,
  generateId,
} from '../../src/lib/db/turso-schema';

const NOW = new Date().toISOString();

async function req(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  return app.request(path, init);
}

async function clearAll() {
  await db.delete(reminders);
  await db.delete(residencies);
  await db.delete(residencyPartners);
  await db.delete(announcementTags);
  await db.delete(announcements);
  await db.delete(eventTags);
  await db.delete(events);
  await db.delete(tags);
  await db.delete(profilesHistory);
  await db.delete(profiles);
  await db.delete(verification);
  await db.delete(account);
  await db.delete(session);
  await db.delete(user);
}

beforeAll(async () => {
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
});

beforeEach(async () => {
  await clearAll();
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await req('GET', '/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe('Auth API', () => {
  const testUser = {
    email: 'auth-test@example.com',
    password: 'securePassword123',
    name: 'Auth Test User',
  };

  it('POST /api/auth/sign-up/email creates a new user', async () => {
    const res = await req('POST', '/api/auth/sign-up/email', testUser);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
  });

  it('POST /api/auth/sign-in/email authenticates a user', async () => {
    await req('POST', '/api/auth/sign-up/email', testUser);
    const res = await req('POST', '/api/auth/sign-in/email', {
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/sign-in/email rejects wrong password', async () => {
    await req('POST', '/api/auth/sign-up/email', testUser);
    const res = await req('POST', '/api/auth/sign-in/email', {
      email: testUser.email,
      password: 'wrongPassword',
    });
    expect(res.status).not.toBe(200);
  });

  it('GET /api/auth/get-session returns null for unauthenticated', async () => {
    const res = await req('GET', '/api/auth/get-session');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

describe('Profiles API', () => {
  const profileId = generateId();
  const userId = 'user-1';

  async function seedProfile(overrides: Record<string, unknown> = {}) {
    await db.insert(profiles).values({
      id: profileId,
      user_id: userId,
      full_name: 'Test User',
      email: 'test@example.com',
      city: 'Dublin',
      country: 'Ireland',
      user_type: 'Alum',
      is_public: true,
      removed: false,
      created_at: NOW,
      updated_at: NOW,
      ...overrides,
    });
  }

  it('GET /api/profiles returns list', async () => {
    await seedProfile();
    const res = await req('GET', '/api/profiles');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].full_name).toBe('Test User');
  });

  it('GET /api/profiles excludes removed', async () => {
    await seedProfile({ removed: true });
    const res = await req('GET', '/api/profiles');
    expect((await res.json())).toHaveLength(0);
  });

  it('GET /api/profiles/:id returns profile', async () => {
    await seedProfile();
    const res = await req('GET', `/api/profiles/${profileId}`);
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe('test@example.com');
  });

  it('GET /api/profiles/:id returns 404', async () => {
    expect((await req('GET', '/api/profiles/missing')).status).toBe(404);
  });

  it('GET /api/profiles/user/:userId returns profile', async () => {
    await seedProfile();
    const res = await req('GET', `/api/profiles/user/${userId}`);
    expect(res.status).toBe(200);
    expect((await res.json()).user_id).toBe(userId);
  });

  it('GET /api/profiles/user/:userId returns 404', async () => {
    expect((await req('GET', '/api/profiles/user/missing')).status).toBe(404);
  });

  it('PUT /api/profiles/:userId updates fields', async () => {
    await seedProfile();
    const res = await req('PUT', `/api/profiles/${userId}`, {
      fullName: 'Updated',
      city: 'London',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.full_name).toBe('Updated');
    expect(data.city).toBe('London');
  });

  it('PUT /api/profiles/:userId returns 404 for missing', async () => {
    expect((await req('PUT', '/api/profiles/missing', { fullName: 'x' })).status).toBe(404);
  });

  it('GET /api/profiles/alumni filters correctly', async () => {
    await seedProfile({ user_type: 'Staff' });
    expect((await (await req('GET', '/api/profiles/alumni')).json())).toHaveLength(0);
  });

  it('GET /api/profiles/search filters by query', async () => {
    await seedProfile();
    const found = await req('GET', '/api/profiles/search?q=Test');
    expect((await found.json())).toHaveLength(1);
    const empty = await req('GET', '/api/profiles/search?q=zzzzz');
    expect((await empty.json())).toHaveLength(0);
  });

  it('GET /api/profiles/type/:userId returns user type', async () => {
    await seedProfile();
    const res = await req('GET', `/api/profiles/type/${userId}`);
    expect((await res.json()).user_type).toBe('Alum');
  });
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

describe('Tags API', () => {
  it('POST /api/tags creates', async () => {
    const res = await req('POST', '/api/tags', { name: 'Networking', color: '#10b981' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Networking');
    expect(data.id).toBeDefined();
  });

  it('GET /api/tags returns ordered', async () => {
    await db.insert(tags).values([
      { name: 'Zeta', color: '#111', created_at: NOW, updated_at: NOW },
      { name: 'Alpha', color: '#222', created_at: NOW, updated_at: NOW },
    ]);
    const data = await (await req('GET', '/api/tags')).json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Alpha');
  });

  it('GET /api/tags/:id returns single', async () => {
    const [t] = await db.insert(tags).values({ name: 'W', color: '#f59e0b', created_at: NOW, updated_at: NOW }).returning();
    expect((await (await req('GET', `/api/tags/${t.id}`)).json()).name).toBe('W');
  });

  it('GET /api/tags/:id returns 404', async () => {
    expect((await req('GET', '/api/tags/missing')).status).toBe(404);
  });

  it('PUT /api/tags/:id updates', async () => {
    const [t] = await db.insert(tags).values({ name: 'Old', color: '#000', created_at: NOW, updated_at: NOW }).returning();
    const res = await req('PUT', `/api/tags/${t.id}`, { name: 'New', color: '#fff' });
    expect((await res.json()).name).toBe('New');
  });

  it('DELETE /api/tags/:id removes', async () => {
    const [t] = await db.insert(tags).values({ name: 'Del', color: '#000', created_at: NOW, updated_at: NOW }).returning();
    const res = await req('DELETE', `/api/tags/${t.id}`);
    expect((await res.json()).success).toBe(true);
    expect((await req('GET', `/api/tags/${t.id}`)).status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

describe('Events API', () => {
  async function seedTag() {
    const [t] = await db.insert(tags).values({ name: 'Tech', color: '#06b6d4', created_at: NOW, updated_at: NOW }).returning();
    return t;
  }

  async function seedEvent(createdBy = 'user-1') {
    const [e] = await db.insert(events).values({ title: 'Meetup', start_at: '2026-06-01T18:00:00Z', created_by: createdBy, created_at: NOW, updated_at: NOW }).returning();
    return e;
  }

  it('GET /api/events returns enriched', async () => {
    const tag = await seedTag();
    const event = await seedEvent();
    await db.insert(eventTags).values({ event_id: event.id, tag_id: tag.id });
    const data = await (await req('GET', '/api/events')).json();
    expect(data).toHaveLength(1);
    expect(data[0].tags).toHaveLength(1);
    expect(data[0].tags[0].name).toBe('Tech');
  });

  it('GET /api/events/:id returns single with tags', async () => {
    const event = await seedEvent();
    const res = await req('GET', `/api/events/${event.id}`);
    expect(res.status).toBe(200);
    expect((await res.json()).tags).toEqual([]);
  });

  it('GET /api/events/:id returns 404', async () => {
    expect((await req('GET', '/api/events/missing')).status).toBe(404);
  });

  it('GET /api/events/user/:userId filters by creator', async () => {
    await seedEvent('user-42');
    await seedEvent('user-99');
    expect((await (await req('GET', '/api/events/user/user-42')).json())).toHaveLength(1);
  });

  it('DELETE /api/events/:id removes event and tag links', async () => {
    const tag = await seedTag();
    const event = await seedEvent();
    await db.insert(eventTags).values({ event_id: event.id, tag_id: tag.id });
    expect((await req('DELETE', `/api/events/${event.id}`)).status).toBe(200);
    expect((await req('GET', `/api/events/${event.id}`)).status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

describe('Announcements API', () => {
  it('POST /api/announcements creates', async () => {
    const res = await req('POST', '/api/announcements', { title: 'Opp', content: 'Details', created_by: 'u1' });
    expect(res.status).toBe(201);
    expect((await res.json()).title).toBe('Opp');
  });

  it('GET /api/announcements returns with tags', async () => {
    await db.insert(announcements).values({ title: 'A1', created_by: 'u1', created_at: NOW, updated_at: NOW });
    const data = await (await req('GET', '/api/announcements')).json();
    expect(data).toHaveLength(1);
    expect(data[0].tags).toEqual([]);
  });

  it('GET /api/announcements/:id returns single', async () => {
    const [a] = await db.insert(announcements).values({ title: 'A2', created_by: 'u1', created_at: NOW, updated_at: NOW }).returning();
    expect((await (await req('GET', `/api/announcements/${a.id}`)).json()).title).toBe('A2');
  });

  it('GET /api/announcements/:id returns 404', async () => {
    expect((await req('GET', '/api/announcements/missing')).status).toBe(404);
  });

  it('PUT /api/announcements/:id updates', async () => {
    const [a] = await db.insert(announcements).values({ title: 'Old', created_by: 'u1', created_at: NOW, updated_at: NOW }).returning();
    expect((await (await req('PUT', `/api/announcements/${a.id}`, { title: 'New' })).json()).title).toBe('New');
  });

  it('DELETE /api/announcements/:id removes', async () => {
    const [a] = await db.insert(announcements).values({ title: 'Del', created_by: 'u1', created_at: NOW, updated_at: NOW }).returning();
    expect((await req('DELETE', `/api/announcements/${a.id}`)).status).toBe(200);
    expect((await req('GET', `/api/announcements/${a.id}`)).status).toBe(404);
  });

  it('POST/DELETE announcement tags', async () => {
    const [a] = await db.insert(announcements).values({ title: 'Tagged', created_by: 'u1', created_at: NOW, updated_at: NOW }).returning();
    const [t] = await db.insert(tags).values({ name: 'Career', color: '#8b5cf6', created_at: NOW, updated_at: NOW }).returning();

    expect((await req('POST', `/api/announcements/${a.id}/tags`, { tag_id: t.id })).status).toBe(201);
    expect((await (await req('GET', `/api/announcements/${a.id}`)).json()).tags).toHaveLength(1);

    expect((await req('DELETE', `/api/announcements/${a.id}/tags/${t.id}`)).status).toBe(200);
    expect((await (await req('GET', `/api/announcements/${a.id}`)).json()).tags).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Residency Partners
// ---------------------------------------------------------------------------

describe('Residency Partners API', () => {
  it('GET /api/residency-partners returns active', async () => {
    await db.insert(residencyPartners).values([
      { name: 'Active', is_active: true, created_at: NOW, updated_at: NOW },
      { name: 'Inactive', is_active: false, created_at: NOW, updated_at: NOW },
    ]);
    const data = await (await req('GET', '/api/residency-partners')).json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Active');
  });

  it('GET /api/residency-partners/:id returns single', async () => {
    const [p] = await db.insert(residencyPartners).values({ name: 'P', created_at: NOW, updated_at: NOW }).returning();
    expect((await (await req('GET', `/api/residency-partners/${p.id}`)).json()).name).toBe('P');
  });
});

// ---------------------------------------------------------------------------
// Residencies
// ---------------------------------------------------------------------------

describe('Residencies API', () => {
  it('GET /api/residencies/user/:userId returns with partner', async () => {
    const [partner] = await db.insert(residencyPartners).values({ name: 'Corp', created_at: NOW, updated_at: NOW }).returning();
    const uid = 'res-user';
    await db.insert(profiles).values({ id: generateId(), user_id: uid, full_name: 'R', email: 'r@x.com', created_at: NOW, updated_at: NOW });
    await db.insert(residencies).values({ phase: 'Phase 1', company_id: partner.id, user_id: uid, created_at: NOW, updated_at: NOW });

    const data = await (await req('GET', `/api/residencies/user/${uid}`)).json();
    expect(data).toHaveLength(1);
    expect(data[0].phase).toBe('Phase 1');
    expect(data[0].partner.name).toBe('Corp');
  });
});

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

describe('Reminders API', () => {
  it('POST /api/reminders creates', async () => {
    const res = await req('POST', '/api/reminders', { user_id: 'u1', target_type: 'event', target_id: 'e1', reminder_at: '2026-06-01T10:00:00Z' });
    expect(res.status).toBe(201);
    expect((await res.json()).status).toBe('pending');
  });

  it('GET /api/reminders/user/:userId returns reminders', async () => {
    await db.insert(reminders).values({ user_id: 'u2', target_type: 'event', target_id: 'e2', reminder_at: '2026-07-01T10:00:00Z', created_at: NOW, updated_at: NOW });
    expect((await (await req('GET', '/api/reminders/user/u2')).json())).toHaveLength(1);
  });

  it('PUT /api/reminders/:id/status updates', async () => {
    const [r] = await db.insert(reminders).values({ user_id: 'u3', target_type: 'ann', target_id: 'a1', reminder_at: '2026-01-01T00:00:00Z', created_at: NOW, updated_at: NOW }).returning();
    const data = await (await req('PUT', `/api/reminders/${r.id}/status`, { status: 'sent' })).json();
    expect(data.status).toBe('sent');
    expect(data.sent_at).toBeDefined();
  });

  it('DELETE /api/reminders/:id removes', async () => {
    const [r] = await db.insert(reminders).values({ user_id: 'u4', target_type: 'event', target_id: 'e3', reminder_at: '2026-08-01T10:00:00Z', created_at: NOW, updated_at: NOW }).returning();
    expect((await (await req('DELETE', `/api/reminders/${r.id}`)).json()).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

describe('Map API', () => {
  it('GET /api/map/current returns profiles with coordinates', async () => {
    await db.insert(profiles).values({ id: generateId(), user_id: 'mu1', full_name: 'Map', email: 'm@x.com', lat: 53.35, lng: -6.26, is_public: true, removed: false, user_type: 'Alum', created_at: NOW, updated_at: NOW });
    await db.insert(profiles).values({ id: generateId(), user_id: 'mu2', full_name: 'NoCoords', email: 'n@x.com', is_public: true, removed: false, user_type: 'Alum', created_at: NOW, updated_at: NOW });
    const data = await (await req('GET', '/api/map/current')).json();
    expect(data).toHaveLength(1);
    expect(data[0].full_name).toBe('Map');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Constants API', () => {
  it('GET /api/constants/user-types returns distinct types', async () => {
    await db.insert(profiles).values([
      { id: generateId(), user_id: 'c1', user_type: 'Admin', email: 'a@x.com', created_at: NOW, updated_at: NOW },
      { id: generateId(), user_id: 'c2', user_type: 'Staff', email: 'b@x.com', created_at: NOW, updated_at: NOW },
      { id: generateId(), user_id: 'c3', user_type: 'Alum', email: 'c@x.com', created_at: NOW, updated_at: NOW },
    ]);
    const data = await (await req('GET', '/api/constants/user-types')).json();
    expect(data).toContain('Admin');
    expect(data).toContain('Staff');
    expect(data).toContain('Alum');
  });

  it('GET /api/constants/event-tags returns ordered', async () => {
    await db.insert(tags).values([
      { name: 'Zulu', color: '#000', created_at: NOW, updated_at: NOW },
      { name: 'Alpha', color: '#fff', created_at: NOW, updated_at: NOW },
    ]);
    const data = await (await req('GET', '/api/constants/event-tags')).json();
    expect(data[0].name).toBe('Alpha');
    expect(data[1].name).toBe('Zulu');
  });
});
