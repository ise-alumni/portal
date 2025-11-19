-- Seed data for local development
-- This file runs automatically when you do supabase db reset

-- Note: Users should be created through Supabase Studio or auth API
-- This seed file only creates the profiles and events
-- Go to http://127.0.0.1:54323 > Authentication > Users to create users manually- you might need to update
-- the person relationships in the profiles table manually

-- Create a dummy user for testing
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create test events with the dummy user
INSERT INTO public.events (
  title,
  description,
  location,
  location_url,
  registration_url,
  start_at,
  end_at,
  organiser_profile_id,
  created_by,
  tags
) VALUES 
(
  'Alumni Dinner    ',
  'Join us for our annual alumni dinner. This is a great opportunity to catch up with fellow alumni and network.',
  'Limerick',
  'https://maps.google.com/',
  'https://forms.google.com',
  '2025-11-15 18:00:00+00',
  '2025-11-15 22:00:00+00',
  null,
  '00000000-0000-0000-0000-000000000000',
  ARRAY['Networking', 'In-Person', 'Alumni']
),
(
  'Hack Night at DogPatch Labs',
  'Here is the github link, [here](https://github.com). A collaborative coding night where alumni come together to work on projects, share knowledge, and build something amazing. Bring your laptop and ideas!',
  'DogPatch Labs',
  'https://maps.google.com/', 
  'https://forms.google.com',
  '2025-09-05 19:00:00+00',
  '2025-09-05 23:00:00+00',
  null,
  '00000000-0000-0000-0000-000000000000',
  ARRAY['Free Food', 'Hackathon', 'In-Person', 'Social']
),
(
  'Career Roundtable',
  'An intimate discussion about career transitions, leadership, and professional growth. Share your experiences and learn from fellow alumni.',
  'Remote',
  'https://maps.google.com/',
  'https://forms.google.com',
  '2025-11-05 17:00:00+00',
  '2025-11-05 19:00:00+00',
  null,
  '00000000-0000-0000-0000-000000000000',
  ARRAY['Career', 'Networking', 'Online', 'Alumni']
);

