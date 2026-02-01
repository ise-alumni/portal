-- Seed sample data for ISE Alumni Portal
-- This script generates realistic test data for development
-- Usage: Run via `just seed [count]` where count defaults to 100

-- Create tags first (needed for events and announcements)
INSERT INTO public.tags (name, color) VALUES
  ('Networking', '#3b82f6'),
  ('Career', '#10b981'),
  ('Social', '#f59e0b'),
  ('Workshop', '#8b5cf6'),
  ('Hackathon', '#ef4444'),
  ('Alumni', '#6366f1'),
  ('In-Person', '#14b8a6'),
  ('Online', '#ec4899'),
  ('Free Food', '#f97316'),
  ('Tech Talk', '#06b6d4'),
  ('Mentorship', '#84cc16'),
  ('Job Opportunity', '#22c55e'),
  ('Important', '#dc2626'),
  ('Deadline', '#f59e0b')
ON CONFLICT (name) DO NOTHING;

-- Generate alumni profiles, events, and announcements
DO $$
DECLARE
  v_networking_tag_id uuid;
  v_career_tag_id uuid;
  v_social_tag_id uuid;
  v_workshop_tag_id uuid;
  v_hackathon_tag_id uuid;
  v_alumni_tag_id uuid;
  v_inperson_tag_id uuid;
  v_online_tag_id uuid;
  v_freefood_tag_id uuid;
  v_techtalk_tag_id uuid;
  v_mentorship_tag_id uuid;
  v_job_tag_id uuid;
  v_important_tag_id uuid;
  v_deadline_tag_id uuid;
  v_user_id uuid;
  v_profile_id uuid;
  v_event_id uuid;
  v_announcement_id uuid;
  v_partner_id uuid;
  v_phase text;
  phases text[] := ARRAY['R1', 'R2', 'R3', 'R4', 'R5'];
  i integer;

  -- Arrays of sample data
  first_names text[] := ARRAY['Aoife', 'Cian', 'Sarah', 'Liam', 'Emma', 'Jack', 'Sophie', 'Sean', 'Katie', 'Oisín',
                              'Niamh', 'Conor', 'Lucy', 'Darragh', 'Grace', 'Adam', 'Rachel', 'Eoin', 'Hannah', 'Rory',
                              'Claire', 'Michael', 'Laura', 'David', 'Anna', 'James', 'Emily', 'Daniel', 'Megan', 'Tom',
                              'Ella', 'Patrick', 'Olivia', 'Mark', 'Jessica', 'Luke', 'Amy', 'Brian', 'Chloe', 'Ryan',
                              'Leah', 'Kevin', 'Zara', 'Dylan', 'Isabella', 'Shane', 'Maya', 'Finn', 'Sophia', 'Alex'];
  last_names text[] := ARRAY['Murphy', 'Kelly', 'O''Sullivan', 'Walsh', 'Smith', 'O''Brien', 'Ryan', 'O''Connor', 'O''Neill', 'Doyle',
                              'McCarthy', 'Gallagher', 'O''Doherty', 'Kennedy', 'Lynch', 'Murray', 'Quinn', 'Moore', 'McLoughlin', 'Carroll',
                              'Connolly', 'Daly', 'O''Connell', 'Wilson', 'Dunne', 'Brennan', 'Burke', 'Collins', 'Campbell', 'Clarke',
                              'Johnston', 'Hughes', 'O''Farrell', 'Fitzgerald', 'Brown', 'Martin', 'Maguire', 'Nolan', 'Flynn', 'Thompson',
                              'O''Callaghan', 'O''Reilly', 'McDonnell', 'McGrath', 'Kavanagh', 'Bell', 'Power', 'Whelan', 'Byrne', 'Hayes'];
  cities text[] := ARRAY['Dublin', 'Cork', 'Limerick', 'Galway', 'Belfast', 'Waterford', 'London', 'Berlin', 'Amsterdam', 'Paris',
                          'Barcelona', 'San Francisco', 'New York', 'Boston', 'Seattle', 'Toronto', 'Vancouver', 'Sydney', 'Singapore', 'Tokyo',
                          'Stockholm', 'Copenhagen', 'Oslo', 'Zürich', 'Munich', 'Vienna', 'Prague', 'Warsaw', 'Lisbon', 'Madrid'];
  countries text[] := ARRAY['Ireland', 'Ireland', 'Ireland', 'Ireland', 'Ireland', 'Ireland', 'UK', 'Germany', 'Netherlands', 'France',
                             'Spain', 'USA', 'USA', 'USA', 'USA', 'Canada', 'Canada', 'Australia', 'Singapore', 'Japan',
                             'Sweden', 'Denmark', 'Norway', 'Switzerland', 'Germany', 'Austria', 'Czech Republic', 'Poland', 'Portugal', 'Spain'];
  companies text[] := ARRAY['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Stripe', 'Shopify', 'Intercom', 'Workday', 'HubSpot',
                             'Salesforce', 'Adobe', 'IBM', 'Oracle', 'SAP', 'Atlassian', 'Slack', 'Dropbox', 'Zoom', 'Figma',
                             'GitLab', 'GitHub', 'Notion', 'Airtable', 'Miro', 'Canva', 'Spotify', 'Netflix', 'Uber', 'Airbnb',
                             'Revolut', 'TransferWise', 'Deliveroo', 'Just Eat', 'Tines', 'Workvivo', 'Flipdish', 'Fenergo', 'SoapBox Labs', 'Rent the Runway',
                             'Squarespace', 'Twilio', 'Datadog', 'Snowflake', 'MongoDB', 'Redis', 'Elastic', 'Confluent', 'HashiCorp', 'Auth0',
                             'Vercel', 'Netlify', 'Cloudflare', 'DigitalOcean', 'Heroku', 'Asana', 'Linear', 'Retool', 'Webflow', 'Framer'];
  job_titles text[] := ARRAY['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'CTO', 'Founder',
                              'Product Manager', 'Senior Product Manager', 'Director of Engineering', 'VP Engineering', 'Technical Lead',
                              'Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps Engineer', 'Data Engineer',
                              'Machine Learning Engineer', 'Solutions Architect', 'Engineering Director', 'Head of Engineering'];
  prof_statuses text[] := ARRAY['employed', 'open_to_work', 'entrepreneur'];

  v_full_name text;
  v_email text;
  v_city text;
  v_country text;
  v_company text;
  v_job_title text;
  v_grad_year int;
  v_is_msc boolean;
  v_is_remote boolean;
  v_is_entrepreneur boolean;
  v_prof_status text;
  v_user_type text;
  v_lat double precision;
  v_lng double precision;
  v_city_idx int;
BEGIN
  -- Get tag IDs
  SELECT id INTO v_networking_tag_id FROM public.tags WHERE name = 'Networking';
  SELECT id INTO v_career_tag_id FROM public.tags WHERE name = 'Career';
  SELECT id INTO v_social_tag_id FROM public.tags WHERE name = 'Social';
  SELECT id INTO v_workshop_tag_id FROM public.tags WHERE name = 'Workshop';
  SELECT id INTO v_hackathon_tag_id FROM public.tags WHERE name = 'Hackathon';
  SELECT id INTO v_alumni_tag_id FROM public.tags WHERE name = 'Alumni';
  SELECT id INTO v_inperson_tag_id FROM public.tags WHERE name = 'In-Person';
  SELECT id INTO v_online_tag_id FROM public.tags WHERE name = 'Online';
  SELECT id INTO v_freefood_tag_id FROM public.tags WHERE name = 'Free Food';
  SELECT id INTO v_techtalk_tag_id FROM public.tags WHERE name = 'Tech Talk';
  SELECT id INTO v_mentorship_tag_id FROM public.tags WHERE name = 'Mentorship';
  SELECT id INTO v_job_tag_id FROM public.tags WHERE name = 'Job Opportunity';
  SELECT id INTO v_important_tag_id FROM public.tags WHERE name = 'Important';
  SELECT id INTO v_deadline_tag_id FROM public.tags WHERE name = 'Deadline';

  -- Generate alumni (count controlled by justfile parameter)
  FOR i IN 1..100 LOOP
    -- Generate random data
    v_full_name := first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' ||
                   last_names[1 + floor(random() * array_length(last_names, 1))];
    v_email := lower(replace(v_full_name, ' ', '.')) || i || '@example.com';
    v_city_idx := 1 + floor(random() * array_length(cities, 1));
    v_city := cities[v_city_idx];
    v_country := countries[v_city_idx];
    v_company := companies[1 + floor(random() * array_length(companies, 1))];
    v_job_title := job_titles[1 + floor(random() * array_length(job_titles, 1))];

    -- Randomly assign BSc or MSc (50/50 split)
    v_is_msc := random() > 0.5;

    -- Set graduation year based on degree type
    IF v_is_msc THEN
      v_grad_year := 2026 + floor(random() * 5); -- 2026-2030 (cohorts 1-5)
    ELSE
      v_grad_year := 2025 + floor(random() * 5); -- 2025-2029 (cohorts 1-5)
    END IF;

    v_is_remote := random() > 0.7;
    v_is_entrepreneur := random() > 0.85;
    v_prof_status := prof_statuses[1 + floor(random() * array_length(prof_statuses, 1))];

    -- Assign lat/lng based on city
    CASE v_city
      WHEN 'Dublin' THEN v_lat := 53.3498; v_lng := -6.2603;
      WHEN 'Cork' THEN v_lat := 51.8985; v_lng := -8.4756;
      WHEN 'Limerick' THEN v_lat := 52.6638; v_lng := -8.6267;
      WHEN 'Galway' THEN v_lat := 53.2707; v_lng := -9.0568;
      WHEN 'Belfast' THEN v_lat := 54.5973; v_lng := -5.9301;
      WHEN 'London' THEN v_lat := 51.5074; v_lng := -0.1278;
      WHEN 'Berlin' THEN v_lat := 52.5200; v_lng := 13.4050;
      WHEN 'Amsterdam' THEN v_lat := 52.3676; v_lng := 4.9041;
      WHEN 'Paris' THEN v_lat := 48.8566; v_lng := 2.3522;
      WHEN 'San Francisco' THEN v_lat := 37.7749; v_lng := -122.4194;
      WHEN 'New York' THEN v_lat := 40.7128; v_lng := -74.0060;
      ELSE v_lat := NULL; v_lng := NULL;
    END CASE;

    -- Most are Alum, some are Staff/Admin
    IF random() > 0.95 THEN
      v_user_type := 'Admin';
    ELSIF random() > 0.9 THEN
      v_user_type := 'Staff';
    ELSE
      v_user_type := 'Alum';
    END IF;

    -- Create user in auth.users
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '', '', '', ''
    );

    -- Create identity
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    );

    -- Profile will be created by trigger, then update it with additional data
    UPDATE public.profiles SET
      full_name = v_full_name,
      city = v_city,
      country = v_country,
      company = v_company,
      job_title = v_job_title,
      graduation_year = v_grad_year,
      msc = v_is_msc,
      bio = 'ISE ' || CASE WHEN v_is_msc THEN 'MSc' ELSE 'BSc' END || ' graduate (Class of ' || v_grad_year || '). Currently working at ' || v_company || ' as ' || v_job_title || '.',
      is_remote = v_is_remote,
      is_entrepreneur = v_is_entrepreneur,
      is_ise_champion = random() > 0.9,
      professional_status = v_prof_status::professional_status_enum,
      user_type = v_user_type,
      lat = v_lat,
      lng = v_lng,
      linkedin_url = 'https://linkedin.com/in/' || lower(replace(v_full_name, ' ', '-')),
      github_url = CASE WHEN random() > 0.5 THEN 'https://github.com/' || lower(replace(v_full_name, ' ', '')) ELSE NULL END
    WHERE user_id = v_user_id;

  END LOOP;

  -- Delete the test@example.com user created by seed.sql (after generating all alumni)
  DELETE FROM auth.users WHERE email = 'test@example.com';

  -- Arrays for event/announcement generation
  DECLARE
    event_titles text[] := ARRAY[
      'ISE Alumni Reunion', 'Startup Weekend', 'Tech Talk Series', 'Career Panel', 'Friday Social',
      'Hackathon', 'Workshop: Web Development', 'Workshop: Cloud Infrastructure', 'Networking Mixer',
      'Alumni Breakfast', 'Industry Insights', 'Coding Challenge', 'Product Demo Day', 'Mentorship Session',
      'Job Fair', 'Skills Workshop', 'Conference Meetup', 'Study Group', 'Book Club', 'Game Night'
    ];
    event_locations text[] := ARRAY[
      'The Workman Club, Dublin', 'Dogpatch Labs, Dublin', 'Google Office, Dublin', 'Microsoft Office, Dublin',
      'The Bernard Shaw, Dublin', 'Online (Zoom)', 'Online (Teams)', 'Limerick City',
      'Cork City', 'Galway City', 'Trinity College Dublin', 'UL Campus', 'Remote'
    ];
    announcement_titles text[] := ARRAY[
      'Software Engineer Position', 'Product Manager Opening', 'Tech Lead Role', 'Internship Opportunity',
      'Mentorship Program Launch', 'Alumni Directory Update', 'Upcoming Event Registration', 'Survey: Alumni Feedback',
      'Community Guidelines Update', 'New Partnership Announcement', 'Workshop Registration Open', 'Call for Speakers',
      'Volunteer Opportunities', 'Alumni Achievement Spotlight', 'Platform Update', 'Scholarship Available',
      'Career Resources Added', 'Job Board Launch', 'Networking Event', 'Research Collaboration'
    ];
    v_event_title text;
    v_event_location text;
    v_event_start timestamp with time zone;
    v_event_end timestamp with time zone;
    v_announcement_title text;
    v_announcement_content text;
    v_announcement_deadline timestamp with time zone;
    v_tag_ids uuid[];
    v_random_tag uuid;
  BEGIN
    -- Generate 50 events (80% past, 20% future)
    FOR i IN 1..50 LOOP
      -- Get random admin/staff user for this event
      SELECT user_id, id INTO v_user_id, v_profile_id
      FROM public.profiles
      WHERE user_type IN ('Admin', 'Staff')
      ORDER BY random()
      LIMIT 1;

      -- If no admin/staff found, use any random user
      IF v_user_id IS NULL THEN
        SELECT user_id, id INTO v_user_id, v_profile_id
        FROM public.profiles
        ORDER BY random()
        LIMIT 1;
      END IF;

      v_event_title := event_titles[1 + floor(random() * array_length(event_titles, 1))] || ' ' || i;
      v_event_location := event_locations[1 + floor(random() * array_length(event_locations, 1))];

      -- 80% past events, 20% future
      IF random() < 0.8 THEN
        -- Past event: 1-12 months ago
        v_event_start := now() - (interval '1 month' * (1 + floor(random() * 12)));
      ELSE
        -- Future event: 1-8 weeks from now
        v_event_start := now() + (interval '1 week' * (1 + floor(random() * 8)));
      END IF;

      v_event_end := v_event_start + (interval '1 hour' * (1 + floor(random() * 4)));

      INSERT INTO public.events (title, description, location, start_at, end_at, created_by, organiser_profile_id)
      VALUES (
        v_event_title,
        'Join us for ' || v_event_title || '. Great opportunity to connect with fellow ISE alumni and expand your network.',
        v_event_location,
        v_event_start,
        v_event_end,
        v_user_id,
        v_profile_id
      ) RETURNING id INTO v_event_id;

      -- Add 1-3 random tags to each event
      FOR j IN 1..(1 + floor(random() * 3)) LOOP
        v_tag_ids := ARRAY[v_networking_tag_id, v_career_tag_id, v_social_tag_id, v_workshop_tag_id,
                           v_hackathon_tag_id, v_alumni_tag_id, v_inperson_tag_id, v_online_tag_id,
                           v_freefood_tag_id, v_techtalk_tag_id];
        v_random_tag := v_tag_ids[1 + floor(random() * array_length(v_tag_ids, 1))];

        INSERT INTO public.event_tags (event_id, tag_id)
        VALUES (v_event_id, v_random_tag)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

    -- Generate 50 announcements
    FOR i IN 1..50 LOOP
      -- Get random admin/staff user
      SELECT user_id INTO v_user_id
      FROM public.profiles
      WHERE user_type IN ('Admin', 'Staff')
      ORDER BY random()
      LIMIT 1;

      -- If no admin/staff found, use first user
      IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.profiles ORDER BY random() LIMIT 1;
      END IF;

      v_announcement_title := announcement_titles[1 + floor(random() * array_length(announcement_titles, 1))];

      -- 30% have deadlines
      IF random() < 0.3 THEN
        v_announcement_deadline := now() + (interval '1 week' * (1 + floor(random() * 8)));
      ELSE
        v_announcement_deadline := NULL;
      END IF;

      v_announcement_content := 'We are excited to announce: ' || v_announcement_title || '. Check back for more details or reach out to the ISE team for information.';

      INSERT INTO public.announcements (title, content, created_by, deadline)
      VALUES (
        v_announcement_title || ' #' || i,
        v_announcement_content,
        v_user_id,
        v_announcement_deadline
      ) RETURNING id INTO v_announcement_id;

      -- Add 1-2 random tags to each announcement
      FOR j IN 1..(1 + floor(random() * 2)) LOOP
        v_tag_ids := ARRAY[v_career_tag_id, v_mentorship_tag_id, v_job_tag_id, v_important_tag_id, v_deadline_tag_id];
        v_random_tag := v_tag_ids[1 + floor(random() * array_length(v_tag_ids, 1))];

        INSERT INTO public.announcement_tags (announcement_id, tag_id)
        VALUES (v_announcement_id, v_random_tag)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END;

  -- Create residency partners
  INSERT INTO public.residency_partners (name, description, website, logo_url)
  VALUES
    ('Google', 'Leading technology company', 'https://google.com', NULL),
    ('Microsoft', 'Global technology leader', 'https://microsoft.com', NULL),
    ('Amazon', 'E-commerce and cloud computing', 'https://amazon.com', NULL);

  -- Create some residencies for random users
  FOR i IN 1..10 LOOP
    SELECT user_id INTO v_user_id FROM public.profiles WHERE user_id != '00000000-0000-0000-0000-000000000000' ORDER BY random() LIMIT 1;
    SELECT id INTO v_partner_id FROM public.residency_partners ORDER BY random() LIMIT 1;
    v_phase := phases[1 + floor(random() * array_length(phases, 1))];

    -- Check if this user already has a residency for this phase
    IF NOT EXISTS (SELECT 1 FROM public.residencies WHERE user_id = v_user_id AND phase = v_phase) THEN
      INSERT INTO public.residencies (
        user_id,
        company_id,
        phase,
        description
      ) VALUES (
        v_user_id,
        v_partner_id,
        v_phase,
        'Residency ' || v_phase || ' completed at partner company.'
      );
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Sample data created successfully!';
  RAISE NOTICE 'Alumni profiles: %', (SELECT COUNT(*) FROM public.profiles WHERE user_id != '00000000-0000-0000-0000-000000000000');
  RAISE NOTICE 'Events: %', (SELECT COUNT(*) FROM public.events);
  RAISE NOTICE 'Announcements: %', (SELECT COUNT(*) FROM public.announcements);
END $$;
