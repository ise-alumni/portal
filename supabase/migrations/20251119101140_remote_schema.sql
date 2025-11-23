revoke delete on table "public"."announcement_tags" from "anon";

revoke insert on table "public"."announcement_tags" from "anon";

revoke references on table "public"."announcement_tags" from "anon";

revoke select on table "public"."announcement_tags" from "anon";

revoke trigger on table "public"."announcement_tags" from "anon";

revoke truncate on table "public"."announcement_tags" from "anon";

revoke update on table "public"."announcement_tags" from "anon";

revoke delete on table "public"."announcement_tags" from "authenticated";

revoke insert on table "public"."announcement_tags" from "authenticated";

revoke references on table "public"."announcement_tags" from "authenticated";

revoke select on table "public"."announcement_tags" from "authenticated";

revoke trigger on table "public"."announcement_tags" from "authenticated";

revoke truncate on table "public"."announcement_tags" from "authenticated";

revoke update on table "public"."announcement_tags" from "authenticated";

revoke delete on table "public"."announcement_tags" from "service_role";

revoke insert on table "public"."announcement_tags" from "service_role";

revoke references on table "public"."announcement_tags" from "service_role";

revoke select on table "public"."announcement_tags" from "service_role";

revoke trigger on table "public"."announcement_tags" from "service_role";

revoke truncate on table "public"."announcement_tags" from "service_role";

revoke update on table "public"."announcement_tags" from "service_role";

alter table "public"."events" drop column "tags";

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


