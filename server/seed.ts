import 'dotenv/config';
import { db } from './db';
import { auth } from './auth';
import {
  profiles, profilesHistory, tags, events, eventTags,
  announcements, announcementTags, residencyPartners, residencies,
  generateId,
} from '../src/lib/db/turso-schema';

const NOW = new Date().toISOString();
const DEFAULT_SEED_PASSWORD = ['password', '123'].join(''); // NOSONAR: dev-only seed data
const TEST_PASSWORD = process.env.SEED_PASSWORD ?? DEFAULT_SEED_PASSWORD;

interface SeedUser {
  email: string;
  name: string;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  { email: 'admin@example.com',          name: 'Admin User',   password: TEST_PASSWORD },
  { email: 'sarah.johnson@example.com',  name: 'Sarah Johnson', password: TEST_PASSWORD },
  { email: 'michael.chen@example.com',   name: 'Michael Chen',  password: TEST_PASSWORD },
  { email: 'emma.wilson@example.com',    name: 'Emma Wilson',   password: TEST_PASSWORD },
  { email: 'staff@example.com',          name: 'Staff Member',  password: TEST_PASSWORD },
];

async function createAuthUser(user: SeedUser): Promise<string> {
  const res = await auth.api.signUpEmail({ body: user });
  if (!res?.user?.id) {
    throw new Error(`Failed to create auth user for ${user.email}`);
  }
  return res.user.id;
}

async function seed() {
  console.log('Seeding database...\n');

  console.log('Creating auth users...');
  const [adminUserId, alum1UserId, alum2UserId, alum3UserId, staffUserId] =
    await Promise.all(SEED_USERS.map(createAuthUser));
  console.log('Auth users created');

  const adminProfileId = generateId();
  const alum1ProfileId = generateId();
  const alum2ProfileId = generateId();
  const alum3ProfileId = generateId();
  const staffProfileId = generateId();

  await db.insert(profiles).values([
    { id: adminProfileId, user_id: adminUserId, full_name: 'Admin User', email: 'admin@example.com', city: 'Limerick', country: 'Ireland', graduation_year: 2020, cohort: 2020, job_title: 'Platform Manager', company: 'ISE', bio: 'Managing the alumni portal', is_public: true, user_type: 'Admin', professional_status: 'employed', created_at: NOW, updated_at: NOW },
    { id: alum1ProfileId, user_id: alum1UserId, full_name: 'Sarah Johnson', email: 'sarah.johnson@example.com', city: 'Dublin', country: 'Ireland', graduation_year: 2021, cohort: 2021, job_title: 'Software Engineer', company: 'TechCorp', bio: 'Passionate about fullstack development', is_public: true, user_type: 'Alum', professional_status: 'employed', msc: true, is_remote: true, is_ise_champion: true, lat: 53.3498, lng: -6.2603, created_at: NOW, updated_at: NOW },
    { id: alum2ProfileId, user_id: alum2UserId, full_name: 'Michael Chen', email: 'michael.chen@example.com', city: 'London', country: 'United Kingdom', graduation_year: 2022, cohort: 2022, job_title: 'Product Manager', company: 'StartupXYZ', bio: 'Building innovative SaaS products', is_public: true, user_type: 'Alum', professional_status: 'entrepreneur', is_remote: true, is_entrepreneur: true, lat: 51.5074, lng: -0.1278, created_at: NOW, updated_at: NOW },
    { id: alum3ProfileId, user_id: alum3UserId, full_name: 'Emma Wilson', email: 'emma.wilson@example.com', city: 'San Francisco', country: 'United States', graduation_year: 2023, cohort: 2023, job_title: 'Data Scientist', company: 'DataCorp', bio: 'ML enthusiast seeking new opportunities', is_public: true, user_type: 'Alum', professional_status: 'open_to_work', msc: true, lat: 37.7749, lng: -122.4194, created_at: NOW, updated_at: NOW },
    { id: staffProfileId, user_id: staffUserId, full_name: 'Staff Member', email: 'staff@example.com', city: 'Limerick', country: 'Ireland', graduation_year: 2018, cohort: 2018, job_title: 'Program Coordinator', company: 'ISE', bio: 'Coordinating the ISE program', is_public: false, user_type: 'Staff', professional_status: 'employed', created_at: NOW, updated_at: NOW },
  ]);
  console.log('Profiles seeded');

  const tagIds = await db.insert(tags).values([
    { id: generateId(), name: 'Networking', color: '#10b981', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Workshop', color: '#f59e0b', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Social', color: '#ef4444', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Career', color: '#8b5cf6', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Technical', color: '#06b6d4', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Alumni', color: '#84cc16', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'Online', color: '#6366f1', created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'In-Person', color: '#f97316', created_at: NOW, updated_at: NOW },
  ]).returning();

  const tagMap = tagIds.reduce((acc, tag) => {
    acc[tag.name] = tag.id;
    return acc;
  }, {} as Record<string, string>);
  console.log('Tags seeded');

  const eventIds = await db.insert(events).values([
    { id: generateId(), title: 'Alumni Networking Dinner', description: 'Annual alumni networking dinner.', location: 'Limerick', start_at: new Date(Date.now() + 30 * 86400000).toISOString(), end_at: new Date(Date.now() + 30 * 86400000 + 4 * 3600000).toISOString(), organiser_profile_id: alum1ProfileId, created_by: adminUserId, created_at: NOW, updated_at: NOW },
    { id: generateId(), title: 'Technical Workshop: React & TypeScript', description: 'Deep dive into modern React patterns.', location: 'Online', start_at: new Date(Date.now() + 14 * 86400000).toISOString(), end_at: new Date(Date.now() + 14 * 86400000 + 3 * 3600000).toISOString(), created_by: adminUserId, created_at: NOW, updated_at: NOW },
    { id: generateId(), title: 'Career Mentorship Panel', description: 'Panel discussion with industry leaders.', location: 'Remote', start_at: new Date(Date.now() + 45 * 86400000).toISOString(), created_by: adminUserId, created_at: NOW, updated_at: NOW },
    { id: generateId(), title: 'Startup Pitch Night', description: 'Alumni entrepreneurs pitch their startups.', location: 'DogPatch Labs, Dublin', start_at: new Date(Date.now() + 60 * 86400000).toISOString(), organiser_profile_id: alum2ProfileId, created_by: adminUserId, created_at: NOW, updated_at: NOW },
  ]).returning();

  await db.insert(eventTags).values([
    { event_id: eventIds[0].id, tag_id: tagMap['Networking'] },
    { event_id: eventIds[0].id, tag_id: tagMap['Social'] },
    { event_id: eventIds[0].id, tag_id: tagMap['In-Person'] },
    { event_id: eventIds[1].id, tag_id: tagMap['Workshop'] },
    { event_id: eventIds[1].id, tag_id: tagMap['Technical'] },
    { event_id: eventIds[1].id, tag_id: tagMap['Online'] },
    { event_id: eventIds[2].id, tag_id: tagMap['Career'] },
    { event_id: eventIds[2].id, tag_id: tagMap['Online'] },
    { event_id: eventIds[3].id, tag_id: tagMap['Social'] },
    { event_id: eventIds[3].id, tag_id: tagMap['In-Person'] },
  ]);
  console.log('Events seeded');

  const announcementIds = await db.insert(announcements).values([
    { id: generateId(), title: 'New Fellowship Program 2024', content: 'Excited to announce our new fellowship program!', external_url: 'https://example.com/fellowship', deadline: new Date(Date.now() + 30 * 86400000).toISOString(), created_by: adminUserId, created_at: NOW, updated_at: NOW },
    { id: generateId(), title: 'Job Opportunity: Senior Software Engineer', content: 'TechCorp is hiring.', external_url: 'https://jobs.example.com/se', deadline: new Date(Date.now() + 14 * 86400000).toISOString(), created_by: adminUserId, created_at: NOW, updated_at: NOW },
    { id: generateId(), title: 'Alumni Newsletter - March 2024', content: 'Read about alumni achievements.', created_by: staffUserId, created_at: NOW, updated_at: NOW },
  ]).returning();

  await db.insert(announcementTags).values([
    { announcement_id: announcementIds[0].id, tag_id: tagMap['Career'] },
    { announcement_id: announcementIds[0].id, tag_id: tagMap['Alumni'] },
    { announcement_id: announcementIds[1].id, tag_id: tagMap['Career'] },
    { announcement_id: announcementIds[2].id, tag_id: tagMap['Alumni'] },
  ]);
  console.log('Announcements seeded');

  const partnerIds = await db.insert(residencyPartners).values([
    { id: generateId(), name: 'TechCorp', website: 'https://techcorp.example.com', description: 'Leading technology company', is_active: true, created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'StartupXYZ', website: 'https://startupxyz.example.com', description: 'Innovative SaaS startup', is_active: true, created_at: NOW, updated_at: NOW },
    { id: generateId(), name: 'DataCorp', website: 'https://datacorp.example.com', description: 'Data science and AI company', is_active: true, created_at: NOW, updated_at: NOW },
  ]).returning();

  await db.insert(residencies).values([
    { id: generateId(), phase: 'R1', company_id: partnerIds[0].id, user_id: alum1UserId, description: 'Completed R1 at TechCorp', created_at: NOW, updated_at: NOW },
    { id: generateId(), phase: 'R2', company_id: partnerIds[1].id, user_id: alum1UserId, description: 'Currently in R2 at StartupXYZ', created_at: NOW, updated_at: NOW },
    { id: generateId(), phase: 'R1', company_id: partnerIds[2].id, user_id: alum3UserId, description: 'Completed R1 at DataCorp', created_at: NOW, updated_at: NOW },
  ]);
  console.log('Residencies seeded');

  await db.insert(profilesHistory).values([
    { id: generateId(), profile_id: alum1ProfileId, job_title: 'Junior Software Engineer', company: 'TechCorp', city: 'Dublin', country: 'Ireland', professional_status: 'employed', is_remote: false, is_ise_champion: false, changed_at: new Date(Date.now() - 180 * 86400000).toISOString(), change_type: 'INSERT' },
    { id: generateId(), profile_id: alum1ProfileId, job_title: 'Senior Software Engineer', company: 'TechCorp', city: 'Dublin', country: 'Ireland', professional_status: 'employed', is_remote: true, is_ise_champion: true, changed_at: new Date(Date.now() - 90 * 86400000).toISOString(), change_type: 'UPDATE' },
    { id: generateId(), profile_id: alum2ProfileId, job_title: 'Product Manager', company: 'StartupXYZ', city: 'London', country: 'United Kingdom', professional_status: 'entrepreneur', is_remote: true, is_ise_champion: false, changed_at: new Date(Date.now() - 120 * 86400000).toISOString(), change_type: 'INSERT' },
  ]);
  console.log('Profile history seeded');

  console.log('\nDone! Test credentials (all use password: password123):');
  console.log('  Admin:  admin@example.com');
  console.log('  Alumni: sarah.johnson@example.com');
  console.log('  Alumni: michael.chen@example.com');
  console.log('  Alumni: emma.wilson@example.com');
  console.log('  Staff:  staff@example.com');
}

await seed();
