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

-- Insert companies
INSERT INTO public.companies (name, website, industry, description) VALUES
('Intercom', 'https://www.intercom.com', 'SaaS', 'Customer messaging platform'),
('Tines', 'https://www.tines.com', 'Security', 'Security automation platform'),
('Amazon', 'https://www.amazon.com', 'E-commerce', 'E-commerce and cloud computing'),
('Stripe', 'https://www.stripe.com', 'Fintech', 'Online payment processing'),
('Tesla', 'https://www.tesla.com', 'Automotive', 'Electric vehicles and clean energy'),
('Shopify', 'https://www.shopify.com', 'E-commerce', 'E-commerce platform'),
('Spotify', 'https://www.spotify.com', 'Media', 'Music streaming service'),
('Uber', 'https://www.uber.com', 'Transportation', 'Ride-sharing and delivery platform');

-- Insert company offices
INSERT INTO public.company_offices (company_id, name, address, city, country, latitude, longitude, is_headquarters) VALUES
-- Intercom offices
((SELECT id FROM public.companies WHERE name = 'Intercom'), 'Dublin Office', '2nd Floor, 1-2 Thomas Street, Dublin 8', 'Dublin', 'Ireland', 53.339450, -6.261825, true),
((SELECT id FROM public.companies WHERE name = 'Intercom'), 'London Office', '55-57 Shoreditch High Street, London E1 6JJ', 'London', 'United Kingdom', 51.526653, -0.089086, false),
((SELECT id FROM public.companies WHERE name = 'Intercom'), 'San Francisco Office', '55 2nd Street, San Francisco, CA 94105', 'San Francisco', 'United States', 37.7749, -122.4194, false),

-- Tines offices
((SELECT id FROM public.companies WHERE name = 'Tines'), 'Dublin Office', '1 Grand Canal Square, Dublin 2', 'Dublin', 'Ireland', 53.345040, -6.253161, true),

-- Amazon offices
((SELECT id FROM public.companies WHERE name = 'Amazon'), 'Seattle HQ', '410 Terry Ave N, Seattle, WA 98109', 'Seattle', 'United States', 47.6062, -122.3321, true),

-- Stripe offices
((SELECT id FROM public.companies WHERE name = 'Stripe'), 'Dublin Office', '1 Grand Canal Square, Dublin 2', 'Dublin', 'Ireland', 53.333766, -6.249404, true),

-- Tesla offices
((SELECT id FROM public.companies WHERE name = 'Tesla'), 'Palo Alto Office', '3500 Deer Creek Road, Palo Alto, CA 94304', 'Palo Alto', 'United States', 37.4419, -122.1430, true),

-- Shopify offices
((SELECT id FROM public.companies WHERE name = 'Shopify'), 'Montreal Office', '150 Elgin Street, Ottawa, ON K2P 1L4', 'Montreal', 'Canada', 45.5017, -73.5673, true),

-- Spotify offices
((SELECT id FROM public.companies WHERE name = 'Spotify'), 'New York Office', '4 World Trade Center, New York, NY 10007', 'New York', 'United States', 40.7128, -74.0060, true),

-- Uber offices
((SELECT id FROM public.companies WHERE name = 'Uber'), 'San Francisco Office', '1455 Market Street, San Francisco, CA 94103', 'San Francisco', 'United States', 37.7749, -122.4194, true);

-- Update profiles with company and office information
UPDATE public.profiles 
SET 
  current_company_id = (SELECT id FROM public.companies WHERE name = 'Intercom'),
  current_office_id = (SELECT id FROM public.company_offices WHERE company_id = (SELECT id FROM public.companies WHERE name = 'Intercom') AND city = 'Dublin'),
  job_title = 'Product Engineer',
  graduation_year = 2025
WHERE user_id = '00000000-0000-0000-0000-000000000000';

