drop extension if exists "pg_net";

revoke delete on table "public"."announcements" from "anon";

revoke insert on table "public"."announcements" from "anon";

revoke references on table "public"."announcements" from "anon";

revoke select on table "public"."announcements" from "anon";

revoke trigger on table "public"."announcements" from "anon";

revoke truncate on table "public"."announcements" from "anon";

revoke update on table "public"."announcements" from "anon";

revoke delete on table "public"."announcements" from "authenticated";

revoke insert on table "public"."announcements" from "authenticated";

revoke references on table "public"."announcements" from "authenticated";

revoke select on table "public"."announcements" from "authenticated";

revoke trigger on table "public"."announcements" from "authenticated";

revoke truncate on table "public"."announcements" from "authenticated";

revoke update on table "public"."announcements" from "authenticated";

revoke delete on table "public"."announcements" from "service_role";

revoke insert on table "public"."announcements" from "service_role";

revoke references on table "public"."announcements" from "service_role";

revoke select on table "public"."announcements" from "service_role";

revoke trigger on table "public"."announcements" from "service_role";

revoke truncate on table "public"."announcements" from "service_role";

revoke update on table "public"."announcements" from "service_role";

revoke delete on table "public"."event_tags" from "anon";

revoke insert on table "public"."event_tags" from "anon";

revoke references on table "public"."event_tags" from "anon";

revoke select on table "public"."event_tags" from "anon";

revoke trigger on table "public"."event_tags" from "anon";

revoke truncate on table "public"."event_tags" from "anon";

revoke update on table "public"."event_tags" from "anon";

revoke delete on table "public"."event_tags" from "authenticated";

revoke insert on table "public"."event_tags" from "authenticated";

revoke references on table "public"."event_tags" from "authenticated";

revoke select on table "public"."event_tags" from "authenticated";

revoke trigger on table "public"."event_tags" from "authenticated";

revoke truncate on table "public"."event_tags" from "authenticated";

revoke update on table "public"."event_tags" from "authenticated";

revoke delete on table "public"."event_tags" from "service_role";

revoke insert on table "public"."event_tags" from "service_role";

revoke references on table "public"."event_tags" from "service_role";

revoke select on table "public"."event_tags" from "service_role";

revoke trigger on table "public"."event_tags" from "service_role";

revoke truncate on table "public"."event_tags" from "service_role";

revoke update on table "public"."event_tags" from "service_role";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke select on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke delete on table "public"."events" from "authenticated";

revoke insert on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "authenticated";

revoke select on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke update on table "public"."events" from "authenticated";

revoke delete on table "public"."events" from "service_role";

revoke insert on table "public"."events" from "service_role";

revoke references on table "public"."events" from "service_role";

revoke select on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke update on table "public"."events" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

drop index if exists "public"."idx_profiles_company";

drop index if exists "public"."idx_profiles_full_name";

alter table "public"."events" add column "tags" uuid[] default '{}'::uuid[];

alter table "public"."profiles" alter column "email_visible" set default false;

alter table "public"."profiles" alter column "msc" set default true;

CREATE INDEX idx_profiles_city ON public.profiles USING btree (city);

CREATE INDEX idx_profiles_country ON public.profiles USING btree (country);

CREATE INDEX idx_profiles_graduation_year ON public.profiles USING btree (graduation_year);

CREATE INDEX idx_profiles_job_title ON public.profiles USING btree (job_title);

CREATE INDEX idx_profiles_company ON public.profiles USING btree (company);

CREATE INDEX idx_profiles_full_name ON public.profiles USING btree (full_name);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_cohort(grad_year integer, is_msc boolean)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  IF grad_year IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For MSc students, cohort is based on year + 1
  -- For BSc students, cohort is based on year
  -- Cohort 1 starts with 2025 BSc / 2026 MSc
  IF is_msc THEN
    RETURN grad_year - 2025;  -- 2026 MSc = 1, 2027 MSc = 2, etc.
  ELSE
    RETURN grad_year - 2024;  -- 2025 BSc = 1, 2026 BSc = 2, etc.
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_cohort_on_graduation_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.cohort = calculate_cohort(NEW.graduation_year, NEW.msc);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;


