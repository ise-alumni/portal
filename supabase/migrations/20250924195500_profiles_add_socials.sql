-- Add optional social and website fields to profiles (idempotent)
alter table public.profiles
  add column if not exists github_url text null,
  add column if not exists linkedin_url text null,
  add column if not exists twitter_url text null,
  add column if not exists website_url text null;

-- Backfill simple defaults for existing rows (only where null)
update public.profiles p
set
  github_url = coalesce(github_url, 'https://github.com'),
  linkedin_url = coalesce(linkedin_url, 'https://www.linkedin.com'),
  twitter_url = coalesce(twitter_url, 'https://twitter.com'),
  website_url = coalesce(website_url, 'https://example.com')
where true;


